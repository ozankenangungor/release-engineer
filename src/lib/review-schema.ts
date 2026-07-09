import { z } from "zod";

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
const text = (max: number) => z.string().trim().min(1).max(max);
const items = z.array(text(1_500)).max(20);

export const reviewSchema = z.strictObject({
  overallRisk: severitySchema,
  verdict: z.enum(["merge", "review", "hold"]),
  summary: text(2_000),
  findings: z
    .array(
      z.strictObject({
        severity: severitySchema,
        category: z.enum([
          "regression",
          "correctness",
          "testing",
          "breaking_change",
          "security",
          "dependency",
          "configuration",
          "operations",
        ]),
        title: text(200),
        explanation: text(2_000),
        file: text(4_096).nullable(),
        recommendation: text(1_500),
      }),
    )
    .max(20),
  testingGaps: items,
  breakingChanges: items,
  recommendedActions: items,
  limitations: items,
});
export type Review = z.infer<typeof reviewSchema>;

export function validateReviewResponse(raw: string): Review {
  return reviewSchema.parse(JSON.parse(raw));
}

export const analysisResponseSchema = z.strictObject({
  review: reviewSchema,
  pullRequest: z.strictObject({
    url: z
      .string()
      .url()
      .regex(/^https:\/\/github\.com\//),
    owner: text(39),
    repository: text(100),
    number: z.number().int().positive(),
    title: text(1_024),
    baseBranch: text(1_024),
    headBranch: text(1_024),
    headSha: text(64),
    additions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    changedFileCount: z.number().int().nonnegative(),
  }),
  coverage: z.strictObject({
    totalFiles: z.number().int().nonnegative(),
    retrievedFiles: z.number().int().nonnegative(),
    includedFiles: z.number().int().nonnegative(),
    truncatedPatches: z.number().int().nonnegative(),
    missingPatches: z.number().int().nonnegative(),
    descriptionTruncated: z.boolean(),
    filesNotRetrieved: z.boolean(),
    partial: z.boolean(),
  }),
  warnings: z.array(z.string()).max(10),
});
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
