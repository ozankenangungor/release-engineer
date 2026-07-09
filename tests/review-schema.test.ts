import { describe, expect, it } from "vitest";
import { validateReviewResponse } from "@/lib/review-schema";
import { review } from "./fixtures";

describe("structured review validation", () => {
  it("accepts no findings as a successful result", () => {
    expect(validateReviewResponse(JSON.stringify(review()))).toEqual(review());
  });
  it("accepts a concrete finding with an optional file represented as null", () => {
    const value = review({
      findings: [
        {
          severity: "high",
          category: "correctness",
          title: "Incorrect fallback",
          explanation: "The visible change discards the fallback.",
          file: null,
          recommendation: "Restore the fallback.",
        },
      ],
    });
    expect(validateReviewResponse(JSON.stringify(value))).toEqual(value);
  });
  it.each([
    "not JSON",
    "```json\n{}\n```",
    "{}",
    JSON.stringify({ ...review(), overallRisk: "safe" }),
    JSON.stringify({ ...review(), verdict: "ship" }),
    JSON.stringify({ ...review(), summary: " " }),
    JSON.stringify({
      ...review(),
      findings: [{ title: "Missing required fields" }],
    }),
    JSON.stringify({ ...review(), testingGaps: "none" }),
    JSON.stringify({ ...review(), extra: "untrusted" }),
    JSON.stringify({ ...review(), summary: "a".repeat(2_001) }),
    JSON.stringify({
      ...review(),
      findings: Array(21).fill({
        severity: "low",
        category: "security",
        title: "Risk",
        explanation: "Evidence",
        file: null,
        recommendation: "Check",
      }),
    }),
  ])("fails safely for malformed or out-of-schema output", (raw) => {
    expect(() => validateReviewResponse(raw)).toThrow();
  });
});
