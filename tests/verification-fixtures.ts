import type { AnalysisResponse } from "@/lib/review-schema";
import { pullRequest, review } from "./fixtures";

// Authored offline test data. This is neither a Claude response nor user evidence.
export function handoffResponse(): AnalysisResponse {
  const { files, body, filesTruncated, ...publicPr } = pullRequest({ changedFileCount: 2 });
  void files; void body; void filesTruncated;
  return {
    pullRequest: publicPr,
    review: review({
      overallRisk: "medium", verdict: "review",
      summary: "Offline test fixture: an API contract may change.",
      findings: [{
        severity: "medium", category: "breaking_change", title: "Response contract may change",
        file: "src/app.ts", explanation: "A response shape is changed in this test fixture.",
        recommendation: "Check the callers and run a compatibility test.",
      }],
      limitations: ["Offline test fixture. Full repository not inspected; tests were not run."],
      testingGaps: ["A compatibility check is needed."],
    }),
    coverage: {
      totalFiles: 2, retrievedFiles: 2, includedFiles: 1, truncatedPatches: 0,
      missingPatches: 1, descriptionTruncated: false, filesNotRetrieved: false, partial: true,
    },
    warnings: ["One changed-file patch is unavailable (offline fixture)."],
  };
}
