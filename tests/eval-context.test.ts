import { describe, expect, it } from "vitest";
import { buildReviewContext, byteLength, truncateUtf8, CONTEXT_LIMITS } from "@/lib/context";
import { MAX_GITHUB_FILES } from "@/lib/github";
import { enforceReviewCoverage } from "@/lib/review-policy";
import { gradeReview } from "../evals/grader";
import { evaluationDataset, scopedReview } from "./eval-helpers";
import { file, pullRequest, review } from "./fixtures";

describe("production context and coverage evaluation", () => {
  it.each(Array.from({ length: 17 }, (_, index) => index))("keeps complete UTF-8 code points at a %i-byte boundary", boundary => {
    const truncated = truncateUtf8("é🧪中aé🧪", boundary);
    expect(byteLength(truncated)).toBeLessThanOrEqual(boundary);
    expect(truncated).not.toContain("\ufffd");
    expect("é🧪中aé🧪".startsWith(truncated)).toBe(true);
  });
  it("fits the exact serialized byte budget and omits a file one byte below it", () => {
    const pr = pullRequest({ files: [file("src/main.ts", "λ".repeat(4_000))] });
    const full = buildReviewContext(pr);
    const bytes = byteLength(full.json);
    expect(bytes).toBeGreaterThanOrEqual(8_000);
    expect(buildReviewContext(pr, { ...CONTEXT_LIMITS, maxBytes: bytes }).coverage.includedFiles).toBe(1);
    const lower = buildReviewContext(pr, { ...CONTEXT_LIMITS, maxBytes: bytes - 1 });
    expect(lower.coverage.includedFiles).toBe(0);
    expect(byteLength(lower.json)).toBeLessThanOrEqual(bytes - 1);
  });
  it("accounts for JSON escaping and still includes a later file that fits", () => {
    const pr = pullRequest({ files: [file("src/a.ts", '"'.repeat(7_900)), file("src/b.ts", "+const value = 1;")], changedFileCount: 2 });
    const context = buildReviewContext(pr, { ...CONTEXT_LIMITS, maxBytes: 8_000 });
    expect(JSON.parse(context.json).files.map((value: { filename: string }) => value.filename)).toEqual(["src/b.ts"]);
    expect(context.coverage.partial).toBe(true);
    expect(byteLength(context.json)).toBeLessThanOrEqual(8_000);
  });
  it("prioritizes auth/security/configuration/migrations deterministically", () => {
    const sensitive = [".github/workflows/check.yml", "migrations/001.sql", "package.json", "src/auth.ts", "src/config.ts", "src/security.ts"];
    const files = [...sensitive, "src/normal.ts", "tests/a.test.ts", "docs/readme.md", "pnpm-lock.yaml", "fixtures/auth.ts"].map(path => file(path));
    const pr = pullRequest({ files, changedFileCount: files.length });
    const limits = { ...CONTEXT_LIMITS, maxFiles: sensitive.length };
    const first = buildReviewContext(pr, limits);
    expect(first.json).toBe(buildReviewContext({ ...pr, files: [...files].reverse() }, limits).json);
    expect(JSON.parse(first.json).files.map((value: { filename: string }) => value.filename)).toEqual(sensitive);
  });
  it("discloses an upstream retrieval cap independently from the context file cap", () => {
    const files = Array.from({ length: MAX_GITHUB_FILES }, (_, index) => file(`src/${index}.ts`));
    const context = buildReviewContext(pullRequest({ files, changedFileCount: MAX_GITHUB_FILES + 1, filesTruncated: true }));
    expect(context.coverage).toMatchObject({ retrievedFiles: MAX_GITHUB_FILES, filesNotRetrieved: true, includedFiles: CONTEXT_LIMITS.maxFiles, partial: true });
    expect(byteLength(context.json)).toBeLessThanOrEqual(CONTEXT_LIMITS.maxBytes);
  });
  it.each(evaluationDataset.prepared.filter(test => test.context.coverage.partial).map(test => [test.fixture.id, test] as const))("enforces and grades incomplete coverage for %s", (id, test) => {
    const raw = review({ verdict: "merge" });
    const delivered = enforceReviewCoverage(raw, test.context);
    expect(raw.verdict).toBe("merge");
    expect(delivered.verdict).toBe("review");
    expect(delivered.limitations).toEqual(expect.arrayContaining(test.context.warnings));
    expect(gradeReview(test, { ...scopedReview(id), verdict: "merge" }).failures).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PARTIAL_MERGE", critical: true })]));
    const payload = JSON.parse(test.context.json);
    expect(payload.coverage).toEqual(test.context.coverage);
    expect(payload.files.every((entry: { patch: string | null }) => entry.patch === null || byteLength(entry.patch) <= (test.fixture.limits?.maxPatchBytes ?? CONTEXT_LIMITS.maxPatchBytes))).toBe(true);
  });
});
