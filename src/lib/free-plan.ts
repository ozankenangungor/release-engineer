// Anonymous, device-local allowance for the homepage. This is not an account
// entitlement or a server-side abuse boundary; API admission remains separate.
export const FREE_DAILY_REVIEWS = 10;
export const FREE_MONTHLY_REVIEWS = 10;
export const PRO_DAILY_REVIEWS = 100;
export const PRO_MONTHLY_REVIEWS = 100;
export const FREE_USAGE_KEY = "release-engineer:free-usage:v1";
export const FREE_REVIEW_LOCK = "release-engineer:free-review";

type UsageStorage = Pick<Storage, "getItem" | "setItem">;
export type FreeUsage = { day: string; used: number };

export class FreeLimitError extends Error {
  constructor(message = `You have used this month's ${FREE_MONTHLY_REVIEWS} free reviews in this browser. Your allowance resets on the first day of the next UTC month.`) {
    super(message);
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
  const monthly = readMonthlyFreeUsage(storage, now);
  if (monthly.monthlyUsed >= FREE_MONTHLY_REVIEWS) {
    throw new FreeLimitError();
  }
  // Verify storage is writable before starting work. A reservation does not
  // consume a review: only a validated, completed response increments usage.
  storage.setItem(FREE_USAGE_KEY, JSON.stringify({ ...usage, ...monthly }));
}

export function completeFreeReview(storage: UsageStorage, now = new Date()): FreeUsage {
  const usage = readFreeUsage(storage, now);
  const monthly = readMonthlyFreeUsage(storage, now);
  const completed = { ...usage, used: Math.min(FREE_DAILY_REVIEWS, usage.used + 1) };
  storage.setItem(FREE_USAGE_KEY, JSON.stringify({ ...completed, ...monthly, monthlyUsed: Math.min(FREE_MONTHLY_REVIEWS, monthly.monthlyUsed + 1) }));
  return completed;
}

export function readMonthlyFreeUsage(storage: UsageStorage, now = new Date()) {
  const month = now.toISOString().slice(0, 7);
  try {
    const raw = JSON.parse(storage.getItem(FREE_USAGE_KEY) ?? "null");
    if (raw?.month === month && Number.isSafeInteger(raw.monthlyUsed) && raw.monthlyUsed >= 0)
      // Keep usage from the previous, larger allowance when lowering the cap.
      return { month, monthlyUsed: Math.min(FREE_MONTHLY_REVIEWS, raw.monthlyUsed as number) };
    // Upgrade an older valid device counter without inventing historical usage.
    if (!raw?.month && typeof raw?.day === "string" && raw.day.startsWith(month) && Number.isInteger(raw.used) && raw.used >= 0 && raw.used <= FREE_DAILY_REVIEWS)
      return { month, monthlyUsed: raw.used as number };
  } catch { /* Same local recovery boundary as the daily counter. */ }
  return { month, monthlyUsed: 0 };
}
