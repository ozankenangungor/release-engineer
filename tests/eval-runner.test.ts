import { describe, expect, it, vi } from "vitest";
import { runEvaluation, runExitCode, type ReviewExecutor } from "../evals/runner";
import { AnalysisError } from "@/lib/errors";
import { correctNullReview, evaluationCase, scopedReview, scriptedExecution, scriptedMetadata } from "./eval-helpers";

const positive = evaluationCase("correctness-null-dereference");
const safe = evaluationCase("safe-documentation");

describe("evaluation execution and spend safeguards", () => {
  it("records actual grades, timing and usage, with reviews omitted by default", async () => {
    let time = 0;
    const checkpoints: string[][] = [];
    const execute = vi.fn(async () => scriptedExecution(correctNullReview(), positive.fixture.id));
    const run = await runEvaluation([positive], scriptedMetadata([positive.fixture.id]), execute, {
      now: () => time += 20,
      checkpoint: async run => { checkpoints.push(run.cases.map(record => record.status)); },
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(checkpoints).toEqual([["NOT_RUN"], ["PASS"]]);
    expect(run.cases[0]).toMatchObject({ status: "PASS", durationMs: 20 });
    expect(run.cases[0]).not.toHaveProperty("modelReview");
    expect(run.summary.usage).toMatchObject({ inputTokens: 20, outputTokens: 10, responsesWithUsage: 1 });
    expect(runExitCode(run)).toBe(0);
  });
  it("exposes a raw-model partial merge even when the production guard corrects it", async () => {
    const test = evaluationCase("partial-missing-patch");
    const modelReview = scopedReview(test.fixture.id, { verdict: "review" });
    modelReview.verdict = "merge";
    const run = await runEvaluation([test], scriptedMetadata([test.fixture.id]), async () => scriptedExecution(modelReview, test.fixture.id), { includeReviews: true });
    expect(run.cases[0]).toMatchObject({ status: "FAIL", modelReview: { verdict: "merge" }, deliveredReview: { verdict: "review" } });
    expect(run.summary.modelMetrics.partialContextSafety.value).toBe(0);
    expect(run.summary.deliveredMetrics.partialContextSafety.value).toBe(1);
    expect(run.summary.modelCriticalFailures).toBeGreaterThan(0);
    expect(runExitCode(run)).toBe(1);
  });
  it("records invalid structured output as a failure and preserves response usage", async () => {
    const execute = vi.fn<ReviewExecutor>(async (_test, observe) => {
      observe(scriptedExecution(correctNullReview(), positive.fixture.id).metadata);
      throw new AnalysisError("INVALID_REVIEW", "Sensitive provider body must never be persisted.");
    });
    const run = await runEvaluation([positive, safe], scriptedMetadata([positive.fixture.id, safe.fixture.id]), execute);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(run.cases.map(record => record.status)).toEqual(["FAIL", "NOT_RUN"]);
    expect(run.cases[0]?.modelGrade?.metrics.schemaValidity.value).toBe(0);
    expect(run.summary.usage.inputTokens).toBe(20);
    expect(JSON.stringify(run)).not.toContain("Sensitive provider body");
    expect(run.summary.completion).toBe(0.5);
    expect(runExitCode(run)).toBe(2);
  });
  it("stops on infrastructure errors without retrying or dropping cases", async () => {
    const execute = vi.fn(async () => { throw new AnalysisError("CLAUDE_UNAVAILABLE", "Do not log this message."); });
    const run = await runEvaluation([positive, safe], scriptedMetadata([positive.fixture.id, safe.fixture.id]), execute);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(run.cases.map(record => record.status)).toEqual(["INFRASTRUCTURE_ERROR", "NOT_RUN"]);
    expect(run.summary.modelMetrics.schemaValidity.value).toBeNull();
    expect(run.summary.caseCount).toBe(2);
    expect(run.summary.passed).toBe(false);
    expect(JSON.stringify(run)).not.toContain("Do not log");
  });
  it("continues selected cases after an ordinary rubric failure", async () => {
    const run = await runEvaluation([positive, safe], scriptedMetadata([positive.fixture.id, safe.fixture.id]), async test =>
      scriptedExecution(scopedReview(test.fixture.id), test.fixture.id));
    expect(run.cases.map(record => record.status)).toEqual(["FAIL", "PASS"]);
    expect(run.summary.completion).toBe(1);
    expect(run.summary.modelMetrics.requiredRiskRecall.value).toBe(0);
  });
  it("aborts before starting another request and keeps the denominator intact", async () => {
    const controller = new AbortController();
    const execute = vi.fn(async () => { controller.abort(); return scriptedExecution(correctNullReview(), positive.fixture.id); });
    const run = await runEvaluation([positive, safe], scriptedMetadata([positive.fixture.id, safe.fixture.id]), execute, { signal: controller.signal });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(run.cases.map(record => record.status)).toEqual(["PASS", "NOT_RUN"]);
  });
  it("fails before a request if the initial checkpoint cannot be written", async () => {
    const execute = vi.fn();
    await expect(runEvaluation([positive], scriptedMetadata([positive.fixture.id]), execute, {
      checkpoint: async () => { throw new Error("Disk unavailable"); },
    })).rejects.toThrow("Disk unavailable");
    expect(execute).not.toHaveBeenCalled();
  });
  it("sanitizes arbitrary executor errors instead of storing their messages", async () => {
    const run = await runEvaluation([positive], scriptedMetadata([positive.fixture.id]), async () => { throw { code: "unsafe secret value", message: "credential" }; });
    expect(run.cases[0]?.errorCode).toBe("EVALUATION_INFRASTRUCTURE");
    expect(JSON.stringify(run)).not.toContain("credential");
  });
});
