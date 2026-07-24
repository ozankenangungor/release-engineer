import { z } from "zod";
import { isDeepStrictEqual } from "node:util";
import { reviewSchema } from "../src/lib/review-schema";
import { gradeSchema, emptyMetrics, metricNames, measure, weightedScore, type Metrics, type Grade } from "./grader";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const count = z.number().int().nonnegative();
const tokens = count.nullable();
export const reviewMetadataSchema = z.strictObject({
  requestedModel: z.string().min(1).max(200),
  servedModel: z.string().min(1).max(200).nullable(),
  stopReason: z.string().min(1).max(100).nullable(),
  usage: z.strictObject({
    inputTokens: tokens, outputTokens: tokens,
    cacheCreationInputTokens: tokens, cacheReadInputTokens: tokens,
  }),
});
export const caseResultSchema = z.strictObject({
  id: z.string().min(1).max(80),
  status: z.enum(["PASS", "FAIL", "INFRASTRUCTURE_ERROR", "NOT_RUN"]),
  contextFingerprint: hash,
  contextBytes: count,
  durationMs: z.number().nonnegative(),
  provider: reviewMetadataSchema.nullable(),
  modelGrade: gradeSchema.nullable(),
  deliveredGrade: gradeSchema.nullable(),
  errorCode: z.string().regex(/^[A-Z_]{1,80}$/).nullable(),
  modelReview: reviewSchema.optional(),
  deliveredReview: reviewSchema.optional(),
}).superRefine((record, ctx) => {
  if (record.status === "PASS" && (!record.modelGrade?.passed || !record.deliveredGrade?.passed))
    ctx.addIssue({ code: "custom", message: "PASS requires both grades to pass" });
  if (record.status === "FAIL" && !(record.modelGrade && !record.modelGrade.passed || record.deliveredGrade && !record.deliveredGrade.passed))
    ctx.addIssue({ code: "custom", message: "FAIL requires a failed model or delivered grade" });
  if (["NOT_RUN", "INFRASTRUCTURE_ERROR"].includes(record.status) && (record.modelGrade || record.deliveredGrade))
    ctx.addIssue({ code: "custom", message: "Unavailable replies cannot be graded as model results" });
  if (record.status === "NOT_RUN" && (record.provider || record.durationMs || record.errorCode || record.modelReview || record.deliveredReview))
    ctx.addIssue({ code: "custom", message: "NOT_RUN cannot contain execution data" });
});
export type CaseResult = z.infer<typeof caseResultSchema>;

export const runMetadataSchema = z.strictObject({
  kind: z.enum(["live", "scripted-test"]),
  evaluatorVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  datasetVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  datasetFingerprint: hash,
  promptFingerprint: hash,
  schemaFingerprint: hash,
  pipelineFingerprint: hash,
  evaluatorFingerprint: hash,
  requestedModel: z.string().min(1).max(200),
  timestamp: z.iso.datetime(),
  nodeVersion: z.string().min(1).max(50),
  caseIds: z.array(z.string().min(1).max(80)).min(1).max(100),
});
export type RunMetadata = z.infer<typeof runMetadataSchema>;

export function aggregateGrades(grades: (Grade | null)[]): Metrics {
  const metrics = emptyMetrics();
  for (const name of metricNames) {
    let numerator = 0, denominator = 0;
    for (const grade of grades) {
      if (!grade) continue;
      numerator += grade.metrics[name].numerator;
      denominator += grade.metrics[name].denominator;
    }
    metrics[name] = measure(numerator, denominator);
  }
  return metrics;
}

export function summarize(cases: CaseResult[]) {
  const statuses = {
    pass: cases.filter(record => record.status === "PASS").length,
    fail: cases.filter(record => record.status === "FAIL").length,
    infrastructureError: cases.filter(record => record.status === "INFRASTRUCTURE_ERROR").length,
    notRun: cases.filter(record => record.status === "NOT_RUN").length,
  };
  const modelMetrics = aggregateGrades(cases.map(record => record.modelGrade));
  const deliveredMetrics = aggregateGrades(cases.map(record => record.deliveredGrade));
  const modelCriticalFailures = cases.flatMap(record => record.modelGrade?.failures ?? []).filter(failure => failure.critical).length;
  const deliveredCriticalFailures = cases.flatMap(record => record.deliveredGrade?.failures ?? []).filter(failure => failure.critical).length;
  const sumUsage = (key: keyof NonNullable<CaseResult["provider"]>["usage"]) => {
    const values = cases.map(record => record.provider?.usage[key]).filter((value): value is number => typeof value === "number");
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  };
  return {
    caseCount: cases.length, statuses,
    completedModelCases: statuses.pass + statuses.fail,
    completion: (statuses.pass + statuses.fail) / cases.length,
    modelMetrics, deliveredMetrics,
    modelScore: weightedScore(modelMetrics), deliveredScore: weightedScore(deliveredMetrics),
    modelCriticalFailures, deliveredCriticalFailures,
    usage: {
      inputTokens: sumUsage("inputTokens"), outputTokens: sumUsage("outputTokens"),
      cacheCreationInputTokens: sumUsage("cacheCreationInputTokens"), cacheReadInputTokens: sumUsage("cacheReadInputTokens"),
      responsesWithUsage: cases.filter(record => record.provider?.usage.inputTokens !== null && record.provider?.usage.inputTokens !== undefined).length,
    },
    passed: statuses.fail === 0 && statuses.infrastructureError === 0 && statuses.notRun === 0 && modelCriticalFailures === 0 && deliveredCriticalFailures === 0,
  };
}

// Aggregates are derived on read so stale or hand-edited totals cannot hide failed cases.
export const runArtifactSchema = z.strictObject({
  formatVersion: z.literal(1),
  metadata: runMetadataSchema,
  cases: z.array(caseResultSchema).min(1).max(100),
  summary: z.unknown().optional(),
}).superRefine((run, ctx) => {
  const ids = run.cases.map(record => record.id);
  if (new Set(ids).size !== ids.length || JSON.stringify(ids) !== JSON.stringify(run.metadata.caseIds))
    ctx.addIssue({ code: "custom", message: "Case IDs must match metadata once, in order" });
}).transform((run, ctx) => {
  const summary = summarize(run.cases);
  if (run.summary !== undefined && !isDeepStrictEqual(run.summary, summary)) {
    ctx.addIssue({ code: "custom", message: "Stored summary does not match the case results" });
    return z.NEVER;
  }
  return { ...run, summary };
});
export type RunArtifact = z.infer<typeof runArtifactSchema>;

export function comparable(baseline: RunArtifact, candidate: RunArtifact): void {
  for (const key of ["kind", "datasetVersion", "datasetFingerprint", "schemaFingerprint", "evaluatorVersion", "evaluatorFingerprint"] as const) {
    if (baseline.metadata[key] !== candidate.metadata[key])
      throw new Error(`Incompatible evaluation artifacts: ${key} differs.`);
  }
  if (JSON.stringify(baseline.metadata.caseIds) !== JSON.stringify(candidate.metadata.caseIds))
    throw new Error("Incompatible evaluation artifacts: case sets differ.");
  if (baseline.summary.completion !== 1 || candidate.summary.completion !== 1)
    throw new Error("Cannot compare quality deltas for incomplete runs; infrastructure errors and NOT_RUN cases must be resolved.");
}

export function compareRuns(baseline: RunArtifact, candidate: RunArtifact) {
  comparable(baseline, candidate);
  const stageDeltas = (stage: "modelMetrics" | "deliveredMetrics") => metricNames.map(name => {
    const before = baseline.summary[stage][name].value;
    const after = candidate.summary[stage][name].value;
    const delta = before === null || after === null ? null : after - before;
    const regressed = delta !== null && (name === "materialFalsePositiveRate" ? delta > 1e-9 : delta < -1e-9);
    return { name, baseline: before, candidate: after, delta, regressed };
  });
  const deltas = stageDeltas("modelMetrics");
  const deliveredDeltas = stageDeltas("deliveredMetrics");
  const newFailures = candidate.cases.filter(record => record.status === "FAIL" && baseline.cases.find(previous => previous.id === record.id)?.status !== "FAIL").map(record => record.id);
  const newCriticalFailures = candidate.cases.flatMap(record => {
    const previous = baseline.cases.find(before => before.id === record.id);
    return (["modelGrade", "deliveredGrade"] as const).flatMap(stage => {
      const keys = new Set(previous?.[stage]?.failures.filter(failure => failure.critical).map(failure => `${failure.code}:${failure.description}`));
      return (record[stage]?.failures ?? []).filter(failure => failure.critical && !keys.has(`${failure.code}:${failure.description}`)).map(failure => ({ caseId: record.id, stage, ...failure }));
    });
  });
  return { deltas, deliveredDeltas, newFailures, newCriticalFailures, regressed: [...deltas, ...deliveredDeltas].some(delta => delta.regressed) || newFailures.length > 0 || newCriticalFailures.length > 0 };
}
