import { describe, expect, it } from "vitest";
import { completeFreeReview, FREE_MONTHLY_REVIEWS, FREE_USAGE_KEY, prepareFreeReview, readFreeUsage, readMonthlyFreeUsage } from "@/lib/free-plan";

const today = new Date("2026-10-11T15:00:00Z");
function storage(raw: string | null = null) {
  const values = new Map<string, string>();
  if (raw !== null) values.set(FREE_USAGE_KEY, raw);
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe("device-local free review allowance", () => {
  it("allows ten completed reviews, then rejects the eleventh without counting attempts", () => {
    const device = storage();
    for (let i = 0; i < FREE_MONTHLY_REVIEWS; i++) {
      prepareFreeReview(device, today);
      expect(readFreeUsage(device, today).used).toBe(i);
      completeFreeReview(device, today);
    }
    expect(() => prepareFreeReview(device, today)).toThrow("month's 10 free reviews");
    expect(readFreeUsage(device, today).used).toBe(10);
  });
  it("does not consume an allowance on preparation or failed work", () => {
    const device = storage();
    prepareFreeReview(device, today);
    prepareFreeReview(device, today);
    expect(readFreeUsage(device, today).used).toBe(0);
  });
  it("persists completed usage and re-reads the latest shared value", () => {
    const device = storage();
    completeFreeReview(device, today);
    completeFreeReview(device, today);
    expect(readFreeUsage(device, today)).toEqual({ day: "2026-10-11", used: 2 });
  });
  it("keeps monthly exhaustion across UTC midnight, including a legacy daily counter", () => {
    const device = storage(JSON.stringify({ day: "2026-10-11", used: 10 }));
    expect(() => prepareFreeReview(device, new Date("2026-10-12T02:59:59+03:00"))).toThrow();
    const midnight = new Date("2026-10-12T03:00:00+03:00");
    expect(() => prepareFreeReview(device, midnight)).toThrow("month's 10");
    expect(readFreeUsage(device, midnight)).toEqual({ day: "2026-10-12", used: 0 });
  });
  it.each(["garbled", "null", '"10"', JSON.stringify({ day: "2026-10-11", used: -1 }), JSON.stringify({ day: "2026-10-11", used: 1.5 }), JSON.stringify({ day: "2026-10-11", used: "2" }), JSON.stringify({ day: "2026-10-11", used: 11 })])("recovers a malformed local counter: %s", (raw) => {
    expect(readFreeUsage(storage(raw), today)).toEqual({ day: "2026-10-11", used: 0 });
  });
  it("does not authorize a request when storage cannot be written", () => {
    const device = { getItem: () => null, setItem: () => { throw new Error("Blocked"); } };
    expect(() => prepareFreeReview(device, today)).toThrow("Blocked");
  });
  it("preserves monthly usage across midnight and resets only at the next UTC month", () => {
    const device = storage(JSON.stringify({ day: "2026-10-11", used: 2, month:"2026-10", monthlyUsed:10 }));
    expect(() => prepareFreeReview(device, new Date("2026-10-12T00:00:00Z"))).toThrow("month's 10");
    expect(() => prepareFreeReview(device, new Date("2026-11-01T00:00:00Z"))).not.toThrow();
  });
  it("preserves usage already above the new cap instead of granting a fresh allowance", () => {
    const device = storage(JSON.stringify({ day: "2026-10-10", used: 4, month: "2026-10", monthlyUsed: 20 }));
    expect(readMonthlyFreeUsage(device, today)).toEqual({ month: "2026-10", monthlyUsed: 10 });
    expect(() => prepareFreeReview(device, today)).toThrow("month's 10");
    expect(readMonthlyFreeUsage(device, new Date("2026-11-01T00:00:00Z"))).toEqual({ month: "2026-11", monthlyUsed: 0 });
  });
  it("shares ten reviews across days within a month", () => {
    const device = storage();
    for (let i = 0; i < 10; i++) {
      const day = new Date(`2026-10-${String(i + 1).padStart(2, "0")}T12:00:00Z`);
      prepareFreeReview(device, day);
      completeFreeReview(device, day);
    }
    expect(readMonthlyFreeUsage(device, today).monthlyUsed).toBe(10);
    expect(() => prepareFreeReview(device, today)).toThrow("month's 10");
  });
  it("never represents more than ten completed reviews", () => {
    const device = storage(JSON.stringify({ day: "2026-10-11", used: 10 }));
    expect(completeFreeReview(device, today).used).toBe(10);
  });
});
