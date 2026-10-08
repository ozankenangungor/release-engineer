import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { z } from "zod";
import { accountDatabase, ensureAccount } from "./accounts";
import { AnalysisError } from "./errors";
import { PADDLE_SANDBOX } from "./paddle-sandbox";

export function billingConfiguration() {
  const environment =
    process.env.PADDLE_ENVIRONMENT === "live" ? "live" : "sandbox";
  const apiKey = process.env.PADDLE_API_KEY;
  const priceId =
    environment === "sandbox"
      ? PADDLE_SANDBOX.priceId
      : process.env.PADDLE_PRICE_ID;
  const token =
    environment === "sandbox"
      ? PADDLE_SANDBOX.token
      : process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  return {
    environment,
    apiKey,
    priceId,
    token,
    ready: Boolean(
      apiKey && priceId && token && process.env.PADDLE_WEBHOOK_SECRET,
    ),
    base:
      environment === "live"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com",
  } as const;
}

async function paddle(path: string, body?: unknown): Promise<unknown> {
  const config = billingConfiguration();
  if (!config.ready)
    throw new AnalysisError(
      "BILLING_UNAVAILABLE",
      "Account billing is being configured. Free analysis remains available.",
      503,
    );
  const response = await fetch(config.base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Paddle-Version": "1",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  if (!response.ok)
    throw new AnalysisError(
      "BILLING_UNAVAILABLE",
      "Billing could not be reached. Please try again later.",
      503,
    );
  const json = z.object({ data: z.unknown() }).parse(await response.json());
  return json.data;
}

export async function accountSubscription(userId: string) {
  const sql = accountDatabase();
  const config = billingConfiguration();
  const rows =
    await sql`SELECT subscription_id, customer_id, environment, status, valid_until
    FROM release_engineer.subscriptions WHERE user_id = ${userId} AND environment = ${config.environment}
    ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'past_due' THEN 1 WHEN 'paused' THEN 2 WHEN 'trialing' THEN 3 ELSE 4 END,
      provider_updated_at DESC LIMIT 1`;
  return rows[0]
    ? {
        id: String(rows[0].subscription_id),
        customerId: String(rows[0].customer_id),
        environment: String(rows[0].environment),
        status: String(rows[0].status),
        renewsAt: rows[0].valid_until
          ? new Date(rows[0].valid_until).toISOString()
          : null,
      }
    : null;
}

export async function createAccountCheckout(userId: string) {
  const config = billingConfiguration();
  if (!config.ready)
    throw new AnalysisError(
      "BILLING_UNAVAILABLE",
      "Account billing is being configured. Free analysis remains available.",
      503,
    );
  await ensureAccount(userId);
  const sql = accountDatabase();
  const lock = randomUUID();
  const claimed =
    await sql`UPDATE release_engineer.accounts SET checkout_lock_id=${lock}::uuid,
    checkout_lock_until=now()+interval '90 seconds' WHERE user_id=${userId}
    AND (checkout_lock_until IS NULL OR checkout_lock_until < now()) RETURNING user_id`;
  if (!claimed.length)
    throw new AnalysisError(
      "BILLING_BUSY",
      "Another checkout request is running. Please wait and retry.",
      409,
    );
  try {
    const subscription = await accountSubscription(userId);
    if (
      subscription &&
      ["active", "past_due", "paused", "trialing"].includes(subscription.status)
    ) {
      throw new AnalysisError(
        "SUBSCRIPTION_EXISTS",
        "Your account already has a subscription. Use Manage subscription to change or cancel it.",
        409,
      );
    }
    // Reopening an unfinished checkout reuses its transaction. Parallel requests
    // serialize in PostgreSQL, so multiple tabs cannot create duplicate bills.
    const previous =
      await sql`SELECT transaction_id FROM release_engineer.checkouts WHERE user_id=${userId}
      AND environment=${config.environment} AND created_at > now()-interval '1 hour' ORDER BY created_at DESC LIMIT 1`;
    if (previous[0]) {
      const existing = z
        .object({
          id: z.string(),
          status: z.string(),
          subscription_id: z.string().nullish(),
          custom_data: z.object({ release_engineer_user_id: z.string() }),
        })
        .parse(await paddle(`/transactions/${previous[0].transaction_id}`));
      if (
        existing.custom_data.release_engineer_user_id !== userId ||
        existing.id !== previous[0].transaction_id
      )
        throw new Error("Checkout association mismatch");
      if (["draft", "ready"].includes(existing.status))
        return {
          transactionId: existing.id,
          environment: config.environment,
          token: config.token,
        };
      const canceledCheckout =
        subscription?.status === "canceled" &&
        existing.subscription_id === subscription.id;
      if (
        ["completed", "paid", "billed"].includes(existing.status) &&
        !canceledCheckout
      )
        throw new AnalysisError(
          "BILLING_PENDING",
          "Payment is being verified. Refresh your account before starting another checkout.",
          409,
        );
    }
    const price = z.object({
      id: z.literal(config.priceId!),
      status: z.literal("active"),
      unit_price: z.object({
        amount: z.literal("900"),
        currency_code: z.literal("USD"),
      }),
      billing_cycle: z.object({
        interval: z.literal("month"),
        frequency: z.literal(1),
      }),
    });
    price.parse(await paddle(`/prices/${config.priceId}`));
    const transaction = z
      .object({ id: z.string().regex(/^txn_[a-z0-9]+$/) })
      .parse(
        await paddle("/transactions", {
          items: [{ price_id: config.priceId, quantity: 1 }],
          custom_data: { release_engineer_user_id: userId },
          collection_mode: "automatic",
        }),
      );
    await sql`INSERT INTO release_engineer.checkouts(transaction_id, user_id, environment) VALUES (${transaction.id}, ${userId}, ${config.environment})`;
    return {
      transactionId: transaction.id,
      environment: config.environment,
      token: config.token,
    };
  } finally {
    await sql`UPDATE release_engineer.accounts SET checkout_lock_until=NULL,checkout_lock_id=NULL WHERE user_id=${userId} AND checkout_lock_id=${lock}::uuid`;
  }
}

export async function createAccountPortal(userId: string) {
  const subscription = await accountSubscription(userId);
  if (!subscription)
    throw new AnalysisError(
      "NO_SUBSCRIPTION",
      "This account has no subscription to manage.",
      404,
    );
  const data = z
    .object({ urls: z.object({ general: z.object({ overview: z.url() }) }) })
    .parse(
      await paddle(`/customers/${subscription.customerId}/portal-sessions`, {
        subscription_ids: [subscription.id],
      }),
    );
  const url = new URL(data.urls.general.overview);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".paddle.com"))
    throw new Error("Invalid billing portal");
  return url.href;
}

export function verifyPaddleSignature(
  raw: string,
  header: string | null,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!secret)
    throw new AnalysisError(
      "BILLING_UNAVAILABLE",
      "Billing notifications are not configured.",
      503,
    );
  if (!header || header.length > 1024)
    throw new AnalysisError(
      "INVALID_SIGNATURE",
      "Invalid notification signature.",
      401,
    );
  const parts = header.split(";").map((v) => v.trim().split("="));
  const timestamps = parts.filter(([k]) => k === "ts").map(([, v]) => v);
  const timestamp = timestamps[0];
  if (
    timestamps.length !== 1 ||
    !timestamp ||
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 5
  )
    throw new AnalysisError(
      "INVALID_SIGNATURE",
      "Invalid notification signature.",
      401,
    );
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${raw}`)
    .digest();
  const valid = parts
    .filter(([k]) => k === "h1")
    .slice(0, 5)
    .some(
      ([, value]) =>
        value &&
        /^[a-f0-9]{64}$/.test(value) &&
        timingSafeEqual(expected, Buffer.from(value, "hex")),
    );
  if (!valid)
    throw new AnalysisError(
      "INVALID_SIGNATURE",
      "Invalid notification signature.",
      401,
    );
}

const eventSchema = z.object({
  event_id: z.string().regex(/^evt_[a-z0-9]+$/),
  event_type: z.string().max(100),
  data: z.object({
    id: z.string().max(100),
    transaction_id: z.string().max(100).nullish(),
    subscription_id: z.string().max(100).nullish(),
  }),
});
const subscriptionSchema = z.object({
  id: z.string().regex(/^sub_[a-z0-9]+$/),
  customer_id: z.string().regex(/^ctm_[a-z0-9]+$/),
  status: z.enum(["active", "canceled", "past_due", "paused", "trialing"]),
  currency_code: z.string(),
  custom_data: z
    .object({ release_engineer_user_id: z.string().min(1).max(128) })
    .nullish(),
  items: z
    .array(
      z.object({
        quantity: z.number(),
        price: z.object({
          id: z.string(),
          unit_price: z.object({
            amount: z.string(),
            currency_code: z.string(),
          }),
          billing_cycle: z
            .object({ interval: z.string(), frequency: z.number() })
            .nullable(),
        }),
      }),
    )
    .max(20),
  current_billing_period: z
    .object({ ends_at: z.iso.datetime({ offset: true }) })
    .nullable(),
  updated_at: z.iso.datetime({ offset: true }),
});

export async function processBillingEvent(input: unknown) {
  const event = eventSchema.parse(input);
  if (
    !event.event_type.startsWith("subscription.") &&
    event.event_type !== "transaction.completed"
  )
    return;
  const config = billingConfiguration();
  const sql = accountDatabase();
  if (
    (
      await sql`SELECT event_id FROM release_engineer.webhook_events WHERE event_id = ${event.event_id} AND environment = ${config.environment}`
    ).length
  )
    return;
  const subscriptionId = event.event_type.startsWith("subscription.")
    ? event.data.id
    : event.data.subscription_id;
  if (!subscriptionId || !/^sub_[a-z0-9]+$/.test(subscriptionId)) return;
  // Read current provider state instead of replaying an old event's status.
  const subscription = subscriptionSchema.parse(
    await paddle(`/subscriptions/${subscriptionId}`),
  );
  const known =
    await sql`SELECT user_id, customer_id FROM release_engineer.subscriptions WHERE subscription_id = ${subscription.id} AND environment = ${config.environment}`;
  let userId: string;
  if (known[0]) {
    userId = String(known[0].user_id);
    if (known[0].customer_id !== subscription.customer_id)
      throw new Error("Subscription association mismatch");
  } else {
    const transactionId =
      event.event_type === "transaction.completed"
        ? event.data.id
        : event.data.transaction_id;
    if (!transactionId || !/^txn_[a-z0-9]+$/.test(transactionId)) return;
    const checkouts =
      await sql`SELECT user_id FROM release_engineer.checkouts WHERE transaction_id = ${transactionId} AND environment = ${config.environment}`;
    if (!checkouts[0]) return; // Public/client-created checkouts cannot create entitlements.
    userId = String(checkouts[0].user_id);
    const transaction = z
      .object({
        status: z.string(),
        subscription_id: z.string().nullable(),
        customer_id: z.string().nullable(),
        custom_data: z.object({ release_engineer_user_id: z.string() }),
      })
      .parse(await paddle(`/transactions/${transactionId}`));
    if (transaction.status !== "completed") return; // transaction.completed will reconcile it.
    if (
      transaction.subscription_id !== subscription.id ||
      transaction.customer_id !== subscription.customer_id ||
      transaction.custom_data.release_engineer_user_id !== userId
    )
      throw new Error("Checkout association mismatch");
  }
  const item = subscription.items[0];
  const period = subscription.current_billing_period?.ends_at ?? null;
  const eligible =
    subscription.custom_data?.release_engineer_user_id === userId &&
    subscription.currency_code === "USD" &&
    subscription.items.length === 1 &&
    item?.quantity === 1 &&
    item.price.id === config.priceId &&
    item.price.unit_price.amount === "900" &&
    item.price.unit_price.currency_code === "USD" &&
    item.price.billing_cycle?.interval === "month" &&
    item.price.billing_cycle.frequency === 1 &&
    (!period || Date.parse(period) <= Date.now() + 35 * 86400000);
  // Plan/quantity/currency changes must revoke an existing entitlement too.
  const validUntil = eligible ? period : null;
  const status = eligible ? subscription.status : "canceled";
  await sql.transaction([
    sql`INSERT INTO release_engineer.subscriptions(subscription_id,user_id,customer_id,environment,status,price_id,valid_until,provider_updated_at)
      VALUES (${subscription.id},${userId},${subscription.customer_id},${config.environment},${status},${config.priceId},${validUntil},${subscription.updated_at})
      ON CONFLICT(subscription_id) DO UPDATE SET status=EXCLUDED.status, valid_until=EXCLUDED.valid_until,
        provider_updated_at=EXCLUDED.provider_updated_at, updated_at=now()
      WHERE release_engineer.subscriptions.user_id=EXCLUDED.user_id
        AND release_engineer.subscriptions.environment=EXCLUDED.environment
        AND release_engineer.subscriptions.provider_updated_at <= EXCLUDED.provider_updated_at`,
    sql`INSERT INTO release_engineer.webhook_events(event_id,environment) VALUES (${event.event_id},${config.environment}) ON CONFLICT DO NOTHING`,
    sql`DELETE FROM release_engineer.webhook_events WHERE processed_at < now() - interval '90 days'`,
    sql`DELETE FROM release_engineer.checkouts WHERE created_at < now() - interval '90 days'`,
  ]);
}
