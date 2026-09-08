import { describe, expect, it } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareRuns, runArtifactSchema } from "../evals/artifacts";
import { runEvaluation } from "../evals/runner";
import { fingerprint, fingerprints } from "../evals/fingerprint";
import { renderComparison, renderReport } from "../evals/report";
import { RELEASE_REVIEW_SYSTEM_PROMPT } from "@/lib/prompt";
import { reviewSchema } from "@/lib/review-schema";
import { z } from "zod";
import { correctNullReview, evaluationCase, evaluationDataset, scopedReview, scriptedExecution, scriptedMetadata } from "./eval-helpers";

const positive = evaluationCase("correctness-null-dereference");
const safe = evaluationCase("safe-documentation");
const correctRun = () => runEvaluation([positive], scriptedMetadata([positive.fixture.id]), async () => scriptedExecution(correctNullReview(), positive.fixture.id));

describe("evaluation artifacts and regression comparisons", () => {
  it("round trips validated results and rejects tampered summaries", async () => {
    const run = await correctRun();
    expect(runArtifactSchema.parse(JSON.parse(JSON.stringify(run)))).toEqual(run);
    const tampered = structuredClone(run); tampered.summary.modelScore = 0;
    expect(runArtifactSchema.safeParse(tampered).success).toBe(false);
  });
  it("rejects status/grade mismatches and duplicate or reordered IDs", async () => {
    const run = await correctRun();
    const wrongStatus = { ...run, cases: [{ ...run.cases[0], status: "NOT_RUN" }], summary: undefined };
    expect(runArtifactSchema.safeParse(wrongStatus).success).toBe(false);
    expect(runArtifactSchema.safeParse({ ...run, cases: [run.cases[0], run.cases[0]], summary: undefined }).success).toBe(false);
    expect(runArtifactSchema.safeParse({ ...run, metadata: { ...run.metadata, caseIds: ["different-case"] } }).success).toBe(false);
  });
  it("exposes deteriorating recall, new failed cases and critical failures separately", async () => {
    const baseline = await correctRun();
    const candidate = await runEvaluation([positive], { ...baseline.metadata, requestedModel: "candidate-model", promptFingerprint: "f".repeat(64), pipelineFingerprint: "0".repeat(64) }, async () =>
      scriptedExecution(scopedReview(positive.fixture.id, { summary: "CI passed." }), positive.fixture.id));
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.regressed).toBe(true);
    expect(comparison.deltas.find(metric => metric.name === "requiredRiskRecall")).toMatchObject({ baseline: 1, candidate: 0, delta: -1 });
    expect(comparison.newFailures).toEqual([positive.fixture.id]);
    expect(comparison.newCriticalFailures.some(failure => failure.code === "UNSUPPORTED_CLAIM")).toBe(true);
    expect(renderComparison(baseline, candidate)).toContain("REGRESSION");
  });
  it("treats a falling material false-positive rate as improvement", async () => {
    const output = scopedReview(safe.fixture.id, { findings: [{ category: "correctness", severity: "high", title: "Invented blocker", explanation: "Documentation breaks runtime behavior.", file: "docs/setup.md", recommendation: "Revert." }] });
    const metadata = scriptedMetadata([safe.fixture.id]);
    const baseline = await runEvaluation([safe], metadata, async () => scriptedExecution(output, safe.fixture.id));
    const candidate = await runEvaluation([safe], metadata, async () => scriptedExecution(scopedReview(safe.fixture.id), safe.fixture.id));
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.deltas.find(metric => metric.name === "materialFalsePositiveRate")).toMatchObject({ delta: -1, regressed: false });
    expect(comparison.regressed).toBe(false);
  });
  it("detects a delivered-policy regression even when the raw model already failed", async () => {
    const raw = correctNullReview(); raw.limitations = [];
    const metadata = scriptedMetadata([positive.fixture.id]);
    const baseline = await runEvaluation([positive], metadata, async () => scriptedExecution(raw, positive.fixture.id));
    const candidate = await runEvaluation([positive], metadata, async () => ({ ...scriptedExecution(raw, positive.fixture.id), review: raw }));
    expect(baseline.cases[0]?.status).toBe("FAIL");
    expect(candidate.cases[0]?.status).toBe("FAIL");
    const comparison = compareRuns(baseline, candidate);
    expect(comparison.deltas.every(delta => !delta.regressed)).toBe(true);
    expect(comparison.deliveredDeltas.find(delta => delta.name === "limitationHonesty")?.regressed).toBe(true);
    expect(comparison.regressed).toBe(true);
  });
  it.each(["kind", "datasetVersion", "datasetFingerprint", "schemaFingerprint", "evaluatorVersion", "evaluatorFingerprint"] as const)("rejects incompatible %s", async field => {
    const baseline = await correctRun();
    const candidate = structuredClone(baseline);
    Object.assign(candidate.metadata, { [field]: field.endsWith("Version") ? "2.0.0" : field === "kind" ? "live" : "f".repeat(64) });
    expect(() => compareRuns(baseline, candidate)).toThrow("Incompatible");
  });
  it("rejects incomplete runs rather than comparing only available successful cases", async () => {
    const baseline = await correctRun();
    const candidate = await runEvaluation([positive], baseline.metadata, async () => { throw new Error("Unavailable"); });
    expect(() => compareRuns(baseline, candidate)).toThrow("incomplete");
    expect(renderReport(candidate)).toContain("INFRASTRUCTURE_ERROR");
    expect(renderReport(candidate)).toContain("N/A");
  });
  it("hashes canonical fixture data, current prompt, schema and implementation", () => {
    expect(fingerprint({ a: 1, b: { x: 2 } })).toBe(fingerprint({ b: { x: 2 }, a: 1 }));
    const values = fingerprints(evaluationDataset.dataset);
    expect(values.promptFingerprint).toBe(fingerprint(RELEASE_REVIEW_SYSTEM_PROMPT));
    expect(values.schemaFingerprint).toBe(fingerprint(z.toJSONSchema(reviewSchema, { target: "draft-7" })));
    expect(values.promptFingerprint).not.toBe(fingerprint(RELEASE_REVIEW_SYSTEM_PROMPT + " "));
    const changed = structuredClone(evaluationDataset.dataset);
    changed.cases[0]!.expected.acceptableVerdicts = ["hold"];
    expect(fingerprint(changed)).not.toBe(values.datasetFingerprint);
    expect(values.pipelineFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(values.evaluatorFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
  it("records an integrity-gate source change as a pipeline change without altering grading provenance", () => {
    const root = mkdtempSync(join(tmpdir(), "release-pipeline-"));
    try {
      mkdirSync(join(root, "src"));
      cpSync("src/lib", join(root, "src/lib"), { recursive: true });
      mkdirSync(join(root, "src/app/api/analyze"), { recursive: true });
      cpSync("src/app/api/analyze/route.ts", join(root, "src/app/api/analyze/route.ts"));
      mkdirSync(join(root, "evals"));
      for (const filename of readdirSync("evals").filter((name) => /\.(?:ts|mjs)$/.test(name)))
        cpSync(join("evals", filename), join(root, "evals", filename));
      const before = fingerprints(evaluationDataset.dataset, root);
      appendFileSync(join(root, "src/lib/review-integrity.ts"), "\n// Authored offline source-change fixture.\n");
      const after = fingerprints(evaluationDataset.dataset, root);
      expect(after.pipelineFingerprint).not.toBe(before.pipelineFingerprint);
      expect(after.evaluatorFingerprint).toBe(before.evaluatorFingerprint);
      expect(after.datasetFingerprint).toBe(before.datasetFingerprint);
      expect(after.promptFingerprint).toBe(before.promptFingerprint);
      expect(after.schemaFingerprint).toBe(before.schemaFingerprint);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
