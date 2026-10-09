import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  verifyPaddleSignature,
  processBillingEvent,
  billingConfiguration,
  createAccountCheckout,
} from "@/lib/billing";
import { accountDatabase } from "@/lib/accounts";
import { PADDLE_SANDBOX } from "@/lib/paddle-sandbox";
import { POST } from "@/app/api/billing/webhook/route";

vi.mock("@/lib/accounts", () => ({
  accountDatabase: vi.fn(),
  ensureAccount: vi.fn(),
}));
const syntheticSecret = "synthetic-webhook-secret";
const now = 1791685200000;
const raw = '{"test":"signed payload"}\n';
const signature = (body = raw, timestamp = now / 1000) =>
  `ts=${timestamp};h1=${createHmac("sha256", syntheticSecret).update(`${timestamp}:${body}`).digest("hex")}`;
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("saved Paddle server key compatibility", () => {
  beforeEach(() => {
    vi.stubEnv("PADDLE_API_KEY", "");
    vi.stubEnv("PADDLE_ENVIRONMENT", "sandbox");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", syntheticSecret);
  });
  it("accepts the sandbox server key saved as a without exposing it in client configuration", () => {
    vi.stubEnv("a", "pdl_sdbx_apikey_synthetic_only");
    const config = billingConfiguration();
    expect(config.apiKey).toBe("pdl_sdbx_apikey_synthetic_only");
    expect(config.ready).toBe(true);
    expect(config.token).toBe(PADDLE_SANDBOX.token);
    expect(config.token).not.toBe(config.apiKey);
  });
  it.each([
    "",
    "unrelated-secret",
    "test_client_token",
    "pdl_live_apikey_synthetic_only",
  ])("does not send the saved value %s to the sandbox API", (value) => {
    vi.stubEnv("a", value);
    expect(billingConfiguration().apiKey).toBeUndefined();
    expect(billingConfiguration().ready).toBe(false);
  });
  it("keeps the standard server key ahead of the saved alias", () => {
    vi.stubEnv("a", "pdl_sdbx_apikey_synthetic_only");
    vi.stubEnv("PADDLE_API_KEY", "canonical-synthetic-key");
    expect(billingConfiguration().apiKey).toBe("canonical-synthetic-key");
  });
  it("requires notification verification before the saved key can enable checkout", () => {
    vi.stubEnv("a", "pdl_sdbx_apikey_synthetic_only");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "");
    expect(billingConfiguration().ready).toBe(false);
  });
  it("accepts only the matching live server key when live billing is configured", () => {
    vi.stubEnv("PADDLE_ENVIRONMENT", "live");
    vi.stubEnv("PADDLE_PRICE_ID", "pri_synthetic");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "live_synthetic_token");
    vi.stubEnv("a", "pdl_sdbx_apikey_synthetic_only");
    expect(billingConfiguration().ready).toBe(false);
    vi.stubEnv("a", "pdl_live_apikey_synthetic_only");
    expect(billingConfiguration().ready).toBe(true);
  });
});

describe("Paddle signature boundary", () => {
  it("verifies exact raw bytes and rejects changes to spacing or payload", () => {
    expect(() =>
      verifyPaddleSignature(raw, signature(), syntheticSecret, now),
    ).not.toThrow();
    expect(() =>
      verifyPaddleSignature(raw.trim(), signature(), syntheticSecret, now),
    ).toThrow();
    expect(() =>
      verifyPaddleSignature(raw, signature(), "wrong", now),
    ).toThrow();
  });
  it.each([
    null,
    "",
    "ts=bad;h1=bad",
    "ts=1791685200;ts=1791685200;h1=bad",
    "x".repeat(1025),
  ])("rejects malformed headers without crashing", (header) => {
    expect(() =>
      verifyPaddleSignature(raw, header, syntheticSecret, now),
    ).toThrow();
  });
  it("rejects old and future signatures and accepts key-rotation signature lists", () => {
    for (const offset of [-6, 6])
      expect(() =>
        verifyPaddleSignature(
          raw,
          signature(raw, now / 1000 + offset),
          syntheticSecret,
          now,
        ),
      ).toThrow();
    expect(() =>
      verifyPaddleSignature(
        raw,
        signature() + ";h1=" + "0".repeat(64),
        syntheticSecret,
        now,
      ),
    ).not.toThrow();
    expect(() =>
      verifyPaddleSignature(raw, signature(), undefined, now),
    ).toThrow();
  });
  it("keeps an unconfigured endpoint closed and bounds actual streamed bytes", async () => {
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "");
    expect(
      (
        await POST(
          new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(503);
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", syntheticSecret);
    expect(
      (
        await POST(
          new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            body: "x".repeat(131073),
            headers: { "content-length": "2" },
          }),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await POST(
          new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
  });
});

describe("server subscription reconciliation", () => {
  const subscription = () => ({
    id: "sub_test",
    customer_id: "ctm_test",
    status: "active",
    currency_code: "USD",
    custom_data: { release_engineer_user_id: "user_test" },
    items: [
      {
        quantity: 1,
        price: {
          id: PADDLE_SANDBOX.priceId,
          unit_price: { amount: "900", currency_code: "USD" },
          billing_cycle: { interval: "month", frequency: 1 },
        },
      },
    ],
    current_billing_period: {
      ends_at: new Date(Date.now() + 86400000).toISOString(),
    },
    updated_at: new Date().toISOString(),
  });
  const database = () => {
    const sql = Object.assign(vi.fn().mockResolvedValue([]), {
      transaction: vi.fn().mockResolvedValue([]),
    });
    vi.mocked(accountDatabase).mockReturnValue(
      sql as unknown as ReturnType<typeof accountDatabase>,
    );
    return sql;
  };
  beforeEach(() => {
    vi.stubEnv("PADDLE_API_KEY", "synthetic-api-key");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", syntheticSecret);
    vi.stubEnv("PADDLE_ENVIRONMENT", "sandbox");
  });
  it("uses sandbox by default and requires server notification setup before checkout readiness", () => {
    vi.stubEnv("PADDLE_ENVIRONMENT", "");
    expect(billingConfiguration().environment).toBe("sandbox");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "");
    expect(billingConfiguration().ready).toBe(false);
  });
  it("does not consult the provider or apply an already processed event again", async () => {
    const sql = database();
    sql.mockResolvedValueOnce([{ event_id: "evt_test" }]);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await processBillingEvent({
      event_id: "evt_test",
      event_type: "subscription.updated",
      data: { id: "sub_test" },
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(sql.transaction).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("ignores client-created transactions without an account checkout association", async () => {
    const sql = database();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: subscription() })),
    );
    await processBillingEvent({
      event_id: "evt_test",
      event_type: "subscription.created",
      data: { id: "sub_test", transaction_id: "txn_client" },
    });
    expect(sql.transaction).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("associates a paid transaction only with its server-created account checkout", async () => {
    const sql = database();
    sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: "user_test" }]);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ data: subscription() }))
        .mockResolvedValueOnce(
          Response.json({
            data: {
              status: "completed",
              subscription_id: "sub_test",
              customer_id: "ctm_test",
              custom_data: { release_engineer_user_id: "user_test" },
            },
          }),
        ),
    );
    await processBillingEvent({
      event_id: "evt_test",
      event_type: "transaction.completed",
      data: { id: "txn_server", subscription_id: "sub_test" },
    });
    expect(sql.transaction).toHaveBeenCalledOnce();
    expect(
      sql.mock.calls.some(
        (call) => call.includes("active") && call.includes("user_test"),
      ),
    ).toBe(true);
  });
  it.each(["canceled", "paused", "past_due"])(
    "reconciles current provider %s state, independent of stale event status",
    async (status) => {
      const sql = database();
      sql
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { user_id: "user_test", customer_id: "ctm_test" },
        ]);
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ data: { ...subscription(), status } }),
          ),
      );
      await processBillingEvent({
        event_id: "evt_test",
        event_type: "subscription.updated",
        data: { id: "sub_test", status: "active" },
      });
      expect(sql.transaction).toHaveBeenCalledOnce();
      expect(sql.mock.calls.some((call) => call.includes(status))).toBe(true);
      vi.unstubAllGlobals();
    },
  );
  it("revokes changed-price and changed-quantity access instead of retaining an old entitlement", async () => {
    const sql = database();
    sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { user_id: "user_test", customer_id: "ctm_test" },
      ]);
    const data = subscription();
    data.items[0]!.quantity = 2;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data })));
    await processBillingEvent({
      event_id: "evt_test",
      event_type: "subscription.updated",
      data: { id: "sub_test" },
    });
    expect(
      sql.mock.calls.some(
        (call) => call.includes("canceled") && call.includes(null),
      ),
    ).toBe(true);
    vi.unstubAllGlobals();
  });
  it("never transfers a subscription to a different provider customer", async () => {
    const sql = database();
    sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { user_id: "user_test", customer_id: "ctm_other" },
      ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: subscription() })),
    );
    await expect(
      processBillingEvent({
        event_id: "evt_test",
        event_type: "subscription.updated",
        data: { id: "sub_test" },
      }),
    ).rejects.toThrow();
    expect(sql.transaction).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("checkout transaction ownership and reuse", () => {
  let sql: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    sql = vi.fn().mockResolvedValue([]);
    vi.mocked(accountDatabase).mockReturnValue(
      sql as unknown as ReturnType<typeof accountDatabase>,
    );
    vi.stubEnv("PADDLE_ENVIRONMENT", "sandbox");
    vi.stubEnv("PADDLE_API_KEY", "synthetic-server-key");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", syntheticSecret);
  });
  it("serializes checkout creation across tabs before contacting Paddle", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(createAccountCheckout("user_test")).rejects.toMatchObject({
      code: "BILLING_BUSY",
      status: 409,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["standard", "saved alias"])(
    "reuses an unfinished account-owned transaction with the %s server key",
    async (source) => {
      const serverKey =
        source === "saved alias"
          ? "pdl_sdbx_apikey_synthetic_only"
          : "synthetic-server-key";
      if (source === "saved alias") {
        vi.stubEnv("PADDLE_API_KEY", "");
        vi.stubEnv("a", serverKey);
      }
      sql
        .mockResolvedValueOnce([{ user_id: "user_test" }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ transaction_id: "txn_existing" }]);
      const fetch = vi.fn().mockResolvedValue(
        Response.json({
          data: {
            id: "txn_existing",
            status: "ready",
            custom_data: { release_engineer_user_id: "user_test" },
          },
        }),
      );
      vi.stubGlobal("fetch", fetch);
      expect((await createAccountCheckout("user_test")).transactionId).toBe(
        "txn_existing",
      );
      expect(fetch).toHaveBeenCalledWith(
        "https://sandbox-api.paddle.com/transactions/txn_existing",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${serverKey}`,
          }),
        }),
      );
      expect(fetch).toHaveBeenCalledOnce();
      expect(String(fetch.mock.calls[0]![0])).toContain(
        "/transactions/txn_existing",
      );
      expect(sql.mock.calls.at(-1)![0].join("")).toContain(
        "checkout_lock_id=NULL",
      );
    },
  );
  it("waits for verification after a paid checkout rather than accepting another payment", async () => {
    sql
      .mockResolvedValueOnce([{ user_id: "user_test" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ transaction_id: "txn_existing" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: {
            id: "txn_existing",
            status: "completed",
            custom_data: { release_engineer_user_id: "user_test" },
          },
        }),
      ),
    );
    await expect(createAccountCheckout("user_test")).rejects.toMatchObject({
      code: "BILLING_PENDING",
      status: 409,
    });
  });
  it("never reuses another account’s transaction", async () => {
    sql
      .mockResolvedValueOnce([{ user_id: "user_test" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ transaction_id: "txn_existing" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: {
            id: "txn_existing",
            status: "ready",
            custom_data: { release_engineer_user_id: "user_other" },
          },
        }),
      ),
    );
    await expect(createAccountCheckout("user_test")).rejects.toThrow(
      "association mismatch",
    );
  });
  it("always releases the checkout lock after a provider failure", async () => {
    sql.mockResolvedValueOnce([{ user_id: "user_test" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    await expect(createAccountCheckout("user_test")).rejects.toMatchObject({
      code: "BILLING_UNAVAILABLE",
    });
    expect(sql.mock.calls.at(-1)![0].join("")).toContain(
      "checkout_lock_id=NULL",
    );
  });
  it.each(["active", "past_due", "paused", "trialing"])(
    "does not create a second bill for an existing %s subscription",
    async (status) => {
      sql
        .mockResolvedValueOnce([{ user_id: "user_test" }])
        .mockResolvedValueOnce([
          {
            subscription_id: "sub_old",
            customer_id: "ctm_test",
            environment: "sandbox",
            status,
            valid_until: null,
          },
        ]);
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      await expect(createAccountCheckout("user_test")).rejects.toMatchObject({
        code: "SUBSCRIPTION_EXISTS",
        status: 409,
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("allows a new subscription after cancellation of the old paid checkout", async () => {
    sql
      .mockResolvedValueOnce([{ user_id: "user_test" }])
      .mockResolvedValueOnce([
        {
          subscription_id: "sub_old",
          customer_id: "ctm_test",
          environment: "sandbox",
          status: "canceled",
          valid_until: null,
        },
      ])
      .mockResolvedValueOnce([{ transaction_id: "txn_existing" }]);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            id: "txn_existing",
            status: "completed",
            subscription_id: "sub_old",
            custom_data: { release_engineer_user_id: "user_test" },
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: {
            id: PADDLE_SANDBOX.priceId,
            status: "active",
            unit_price: { amount: "900", currency_code: "USD" },
            billing_cycle: { interval: "month", frequency: 1 },
          },
        }),
      )
      .mockResolvedValueOnce(Response.json({ data: { id: "txn_new" } }));
    vi.stubGlobal("fetch", fetch);
    expect((await createAccountCheckout("user_test")).transactionId).toBe(
      "txn_new",
    );
    const creation = fetch.mock.calls[2]!;
    expect(JSON.parse(creation[1].body)).toEqual({
      items: [{ price_id: PADDLE_SANDBOX.priceId, quantity: 1 }],
      custom_data: { release_engineer_user_id: "user_test" },
      collection_mode: "automatic",
    });
  });
});
