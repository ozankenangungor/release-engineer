import { describe, expect, it } from "vitest";
import { reviewIntegrityIssues } from "@/lib/review-integrity";
import { buildReviewContext } from "@/lib/context";
import { file, pullRequest, review } from "./fixtures";

describe("delivered review evidence boundaries", () => {
  it.each([
    "I ran the tests and they passed.",
    "All tests passed.",
    "CI is green.",
    "The test suite was executed.",
    "The tests confirm compatibility.",
    "We inspected the full repository.",
    "The full codebase has been reviewed.",
  ])("rejects an explicit unsupported execution assertion: %s", (summary) => {
    expect(reviewIntegrityIssues(review({ summary }), buildReviewContext(pullRequest())))
      .toContain("unsupported_execution_claim");
  });
  it.each([
    "Tests were not run. The full repository was not inspected.",
    "Run the tests before merging.",
    "Add tests to confirm compatibility.",
    "If CI is green, continue your human review.",
    "Ensure all tests passed before you merge.",
    "The PR description claims that tests passed, but this is unverified.",
    "Tests do not prove that this release is safe.",
    "The visible test adds an assertion for the empty input case.",
    "There is no evidence that tests passed.",
    "It is unknown whether tests passed.",
  ])("preserves qualifications, static observations and next actions: %s", (summary) => {
    expect(reviewIntegrityIssues(review({ summary }), buildReviewContext(pullRequest())))
      .toEqual([]);
  });
  it("does not let an attributed statement excuse a later unqualified claim", () => {
    const summary = "The PR description claims tests passed. CI is green.";
    expect(reviewIntegrityIssues(review({ summary }), buildReviewContext(pullRequest())))
      .toContain("unsupported_execution_claim");
  });
  it("requires an exact selected filename with a visible patch", () => {
    const finding = {
      severity: "medium" as const, category: "correctness" as const,
      title: "A visible concern", explanation: "Check the changed behavior.",
      recommendation: "Inspect the affected callers.", file: "src/app.ts",
    };
    const context = buildReviewContext(pullRequest());
    expect(reviewIntegrityIssues(review({ findings: [finding] }), context)).toEqual([]);
    for (const path of ["src/unseen.ts", "src/app.ts:12"])
      expect(reviewIntegrityIssues(review({ findings: [{ ...finding, file: path }] }), context))
        .toContain("unavailable_finding_file");
    const missing = buildReviewContext(pullRequest({ files: [{ ...file(), patch: undefined }] }));
    expect(reviewIntegrityIssues(review({ findings: [finding] }), missing))
      .toContain("unavailable_finding_file");
    expect(reviewIntegrityIssues(review({ findings: [{ ...finding, file: null }] }), missing)).toEqual([]);
  });
  it("checks every report section and has no cross-request pattern state", () => {
    const context = buildReviewContext(pullRequest());
    for (let i = 0; i < 3; i++) {
      expect(reviewIntegrityIssues(review({ recommendedActions: ["CI passed."] }), context))
        .toContain("unsupported_execution_claim");
      expect(reviewIntegrityIssues(review(), context)).toEqual([]);
    }
  });
});
