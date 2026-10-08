// Anonymous, device-local allowance for the homepage. This is not an account
// entitlement or a server-side abuse boundary; API admission remains separate.
export const FREE_DAILY_REVIEWS = 10;
export const PRO_DAILY_REVIEWS = 100;
export const FREE_USAGE_KEY = "release-engineer:free-usage:v1";
export const FREE_REVIEW_LOCK = "release-engineer:free-review";

type UsageStorage = Pick<Storage, "getItem" | "setItem">;
export type FreeUsage = { day: string; used: number };

export class FreeLimitError extends Error {
  constructor() {
    super(`You have used today's ${FREE_DAILY_REVIEWS} free reviews in this browser. Your allowance resets at 00:00 UTC.`);
    this.name = "FreeLimitError";
  }
}

export function readFreeUsage(storage: UsageStorage, now = new Date()): FreeUsage {
  const day = now.toISOString().slice(0, 10);
  const fresh = { day, used: 0 };
  const raw = storage.getItem(FREE_USAGE_KEY);
  if (!raw) return fresh;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" && value !== null &&
      "day" in value && value.day === day &&
      "used" in value && typeof value.used === "number" &&
      Number.isInteger(value.used) && value.used >= 0 &&
      value.used <= FREE_DAILY_REVIEWS
    ) return { day, used: value.used };
  } catch { /* Recover a damaged device-local counter. */ }
  return fresh;
}

export function prepareFreeReview(storage: UsageStorage, now = new Date()) {
  const usage = readFreeUsage(storage, now);
  if (usage.used >= FREE_DAILY_REVIEWS) {
    throw new FreeLimitError();
  }
  // Verify storage is writable before starting work. A reservation does not
  // consume a review: only a validated, completed response increments usage.
  storage.setItem(FREE_USAGE_KEY, JSON.stringify(usage));
}

export function completeFreeReview(storage: UsageStorage, now = new Date()): FreeUsage {
  const usage = readFreeUsage(storage, now);
  const completed = { ...usage, used: Math.min(FREE_DAILY_REVIEWS, usage.used + 1) };
  storage.setItem(FREE_USAGE_KEY, JSON.stringify(completed));
  return completed;
}
