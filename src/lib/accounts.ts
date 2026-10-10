import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { AnalysisError } from "./errors";
import { accountUsageSchema, type AccountUsage } from "./account-types";

// Start the deadline for each HTTP request, including later queries after a
// provider round trip. A client-wide signal would expire before those queries.
neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) => {
  const deadline = AbortSignal.timeout(10000);
  return fetch(input, {
    ...init,
    signal: init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline,
  });
};

export function accountDatabase() {
  if (!process.env.DATABASE_URL)
    throw new AnalysisError(
      "ACCOUNT_UNAVAILABLE",
      "Account usage is temporarily unavailable. Please try again later.",
      503,
    );
  return neon(process.env.DATABASE_URL);
}

// A test subscription can never buy real Claude allowance.
export function liveEntitlementPrice(): string | null {
  return process.env.PADDLE_ENVIRONMENT === "live" &&
    process.env.PADDLE_PRICE_ID?.startsWith("pri_")
    ? process.env.PADDLE_PRICE_ID
    : null;
}

export async function ensureAccount(userId: string) {
  const sql = accountDatabase();
  await sql`INSERT INTO release_engineer.accounts(user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`;
}

export async function accountUsage(userId: string): Promise<AccountUsage> {
  const sql = accountDatabase();
  const rows =
    await sql`SELECT release_engineer.account_usage(${userId}, ${liveEntitlementPrice()}) AS usage`;
  return accountUsageSchema.parse(rows[0]?.usage);
}

export async function reserveAccountReview(userId: string) {
  const id = randomUUID();
  const sql = accountDatabase();
  const rows =
    await sql`SELECT release_engineer.reserve_review(${userId}, ${id}::uuid, ${liveEntitlementPrice()}) AS usage`;
  const data = rows[0]?.usage;
  if (data?.error === "MONTHLY_LIMIT")
    throw new AnalysisError("MONTHLY_LIMIT", "Your account has reached its monthly review limit. Your monthly allowance resets on the first day of the next UTC month.", 429);
  if (data?.error === "DAILY_LIMIT")
    throw new AnalysisError(
      "DAILY_LIMIT",
      "Your account has reached its daily review limit. It resets at 00:00 UTC.",
      429,
    );
  if (data?.error === "ACCOUNT_BUSY")
    throw new AnalysisError(
      "ACCOUNT_BUSY",
      "Another review is running on your account. Wait for it to finish, then try again.",
      429,
    );
  if (data?.reservation !== id)
    throw new AnalysisError(
      "ACCOUNT_UNAVAILABLE",
      "Your review allowance could not be reserved. Please try again.",
      503,
    );
  return { userId, id };
}

export async function finishAccountReview(
  reservation: { userId: string; id: string },
  success: boolean,
) {
  const sql = accountDatabase();
  const rows =
    await sql`SELECT release_engineer.finish_review(${reservation.userId}, ${reservation.id}::uuid, ${success}) AS finished`;
  if (success && rows[0]?.finished !== true)
    throw new AnalysisError(
      "ACCOUNT_UNAVAILABLE",
      "Your review could not be recorded. Please try again.",
      503,
    );
}
