import { reviewSchema, type Review } from "./review-schema";
import type { ReviewContext } from "./context";

export function enforceReviewCoverage(
  modelReview: Review,
  context: ReviewContext,
): Review {
  return reviewSchema.parse({
    ...modelReview,
    verdict:
      context.coverage.partial && modelReview.verdict === "merge"
        ? "review"
        : modelReview.verdict,
    limitations: [
      ...new Set([
        ...modelReview.limitations.slice(0, 14),
        ...context.warnings,
        "Only the supplied PR metadata and patches were reviewed. The full repository was not inspected and tests were not run.",
      ]),
    ],
  });
}
