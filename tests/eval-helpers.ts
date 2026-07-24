import { loadDataset } from "../evals/dataset";
import { enforceReviewCoverage } from "@/lib/review-policy";
import { review } from "./fixtures";
import type { Review } from "@/lib/review-schema";
import type { ReviewExecution } from "@/lib/claude";
import type { RunMetadata } from "../evals/artifacts";

export const evaluationDataset = loadDataset();
export function evaluationCase(id: string) {
  const test = evaluationDataset.prepared.find(test => test.fixture.id === id);
  if (!test) throw new Error(`Missing self-test fixture: ${id}`);
  return test;
}
export function scopedReview(id: string, overrides: Partial<Review> = {}): Review {
  return enforceReviewCoverage(review(overrides), evaluationCase(id).context);
}
export function correctNullReview(): Review {
  return scopedReview("correctness-null-dereference", {
    overallRisk: "high", verdict: "hold", summary: "A null profile reaches a property dereference.",
    findings: [{
      category: "correctness", severity: "high", title: "Nullable profile dereference",
      explanation: "The removed null check means profile.name throws for a null profile.",
      file: "src/profile.ts", recommendation: "Restore the Anonymous fallback and add a null regression test.",
    }],
  });
}
export function scriptedExecution(modelReview: Review, id: string): ReviewExecution {
  return {
    modelReview, review: enforceReviewCoverage(modelReview, evaluationCase(id).context),
    metadata: {
      requestedModel: "scripted-test", servedModel: "scripted-test", stopReason: "end_turn",
      usage: { inputTokens: 20, outputTokens: 10, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 },
    },
  };
}
export function scriptedMetadata(ids: string[]): RunMetadata {
  return {
    kind: "scripted-test", evaluatorVersion: "1.0.0", datasetVersion: "1.0.0",
    datasetFingerprint: "a".repeat(64), promptFingerprint: "b".repeat(64),
    schemaFingerprint: "c".repeat(64), pipelineFingerprint: "d".repeat(64), evaluatorFingerprint: "e".repeat(64),
    requestedModel: "scripted-test", timestamp: "2026-01-01T00:00:00.000Z", nodeVersion: "test",
    caseIds: ids,
  };
}
