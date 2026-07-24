import { performance } from "node:perf_hooks";
import type { ReviewExecution, ReviewMetadata } from "../src/lib/claude";
import { gradeReview } from "./grader";
import { fingerprint } from "./fingerprint";
import { runArtifactSchema, reviewMetadataSchema, type CaseResult, type RunMetadata, type RunArtifact } from "./artifacts";
import type { PreparedCase } from "./dataset";

export type ReviewExecutor = (
  prepared: PreparedCase,
  observe: (metadata: ReviewMetadata) => void,
) => Promise<ReviewExecution>;

export async function runEvaluation(
  prepared: PreparedCase[],
  metadata: RunMetadata,
  execute: ReviewExecutor,
  options: {
    includeReviews?: boolean;
    checkpoint?: (artifact: RunArtifact) => Promise<void>;
    now?: () => number;
    signal?: AbortSignal;
  } = {},
): Promise<RunArtifact> {
  const now = options.now ?? (() => performance.now());
  const records: CaseResult[] = prepared.map(test => ({
    id: test.fixture.id, status: "NOT_RUN", contextFingerprint: fingerprint(test.context.json),
    contextBytes: Buffer.byteLength(test.context.json), durationMs: 0,
    provider: null, modelGrade: null, deliveredGrade: null, errorCode: null,
  }));
  const artifact = () => runArtifactSchema.parse({ formatVersion: 1, metadata, cases: records });
  await options.checkpoint?.(artifact());
  for (let index = 0; index < prepared.length; index++) {
    if (options.signal?.aborted) break;
    const test = prepared[index]!;
    const record = records[index]!;
    const start = now();
    try {
      const execution = await execute(test, provider => { record.provider = reviewMetadataSchema.parse(provider); });
      record.provider = reviewMetadataSchema.parse(execution.metadata);
      record.modelGrade = gradeReview(test, execution.modelReview);
      record.deliveredGrade = gradeReview(test, execution.review);
      record.status = record.modelGrade.passed && record.deliveredGrade.passed ? "PASS" : "FAIL";
      if (options.includeReviews) {
        record.modelReview = execution.modelReview;
        record.deliveredReview = execution.review;
      }
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : null;
      if (code === "INVALID_REVIEW") {
        record.status = "FAIL";
        record.errorCode = "INVALID_REVIEW";
        record.modelGrade = gradeReview(test, undefined);
      } else {
        record.status = "INFRASTRUCTURE_ERROR";
        record.errorCode = typeof code === "string" && /^[A-Z_]{1,80}$/.test(code) ? code : "EVALUATION_INFRASTRUCTURE";
      }
    }
    record.durationMs = Math.max(0, now() - start);
    await options.checkpoint?.(artifact());
    if (record.status === "INFRASTRUCTURE_ERROR" || record.errorCode === "INVALID_REVIEW") break;
  }
  return artifact();
}

export function runExitCode(artifact: RunArtifact): number {
  if (artifact.summary.statuses.infrastructureError || artifact.summary.statuses.notRun) return 2;
  return artifact.summary.passed ? 0 : 1;
}
