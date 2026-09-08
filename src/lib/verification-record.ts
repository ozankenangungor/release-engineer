import { z } from "zod";
import { parseGitHubPullRequestUrl } from "./github-url";
import type { AnalysisResponse } from "./review-schema";

export const VERIFICATION_QUALIFICATION =
  "User-recorded feedback. Assessments and actions are self-reported, not independently verified. This record does not establish accuracy, release safety, a customer or a unique user.";
export const assessmentSchema = z.enum(["not_checked", "supported", "incorrect", "needs_context"]);
export const usefulnessSchema = z.enum(["not_assessed", "useful", "mixed", "not_useful"]);
export const priorUseSchema = z.enum(["not_recorded", "first_review", "used_before"]);
export const actionSchema = z.enum([
  "none_recorded", "checked_evidence", "changed_code", "added_or_changed_tests", "requested_human_review", "other",
]);
const note = z.string().trim().max(2_000);
const sha = z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/);
const publicPr = z.string().max(512).superRefine((value, ctx) => {
  try { parseGitHubPullRequestUrl(value); }
  catch { ctx.addIssue({ code: "custom", message: "A public GitHub PR URL is required." }); }
});

export const feedbackSchema = z.strictObject({
  usefulness: usefulnessSchema,
  priorUse: priorUseSchema,
  actionTaken: actionSchema,
  note,
});
export const findingAssessmentSchema = z.strictObject({
  findingIndex: z.number().int().min(0).max(19),
  title: z.string().trim().min(1).max(200),
  file: z.string().max(4_096).nullable(),
  assessment: assessmentSchema,
  note: z.string().trim().max(1_500),
});
export const verificationRecordSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("release_engineer_verification"),
  recordId: z.uuid(),
  recordedAt: z.iso.datetime(),
  reviewReference: z.strictObject({
    publicPrUrl: publicPr,
    reviewedHeadSha: sha,
    responseReceivedAt: z.iso.datetime().nullable(),
    interfaceRevision: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
    includedFiles: z.number().int().nonnegative(),
    totalChangedFiles: z.number().int().nonnegative(),
    partialContext: z.boolean(),
  }),
  feedback: feedbackSchema,
  findings: z.array(findingAssessmentSchema).max(20),
  qualification: z.literal(VERIFICATION_QUALIFICATION),
}).superRefine((record, ctx) => {
  const seen = new Set<number>();
  for (const [index, finding] of record.findings.entries()) {
    if (seen.has(finding.findingIndex) || finding.findingIndex !== index)
      ctx.addIssue({ code: "custom", path: ["findings", index], message: "Finding references must be unique and contiguous." });
    seen.add(finding.findingIndex);
    if (finding.assessment !== "not_checked" && !finding.note)
      ctx.addIssue({ code: "custom", path: ["findings", index, "note"], message: "Explain the evidence behind each assessment." });
  }
  if ((record.feedback.usefulness !== "not_assessed" || record.feedback.actionTaken !== "none_recorded") && !record.feedback.note)
    ctx.addIssue({ code: "custom", path: ["feedback", "note"], message: "Explain your assessment or the action you took." });
  if (record.reviewReference.includedFiles > record.reviewReference.totalChangedFiles)
    ctx.addIssue({ code: "custom", path: ["reviewReference"], message: "Included files cannot exceed the changed-file count." });
});
export type VerificationRecord = z.infer<typeof verificationRecordSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type FindingAssessment = z.infer<typeof findingAssessmentSchema>;
export type ReviewReceipt = { receivedAt: string | null; interfaceRevision: string | null };
export const EMPTY_FEEDBACK: Feedback = {
  usefulness: "not_assessed", priorUse: "not_recorded", actionTaken: "none_recorded", note: "",
};

export function createVerificationRecord(
  result: AnalysisResponse,
  receipt: ReviewReceipt,
  feedback: Feedback,
  assessments: FindingAssessment[],
  identity: { recordId: string; recordedAt: string },
): VerificationRecord {
  if (assessments.length !== result.review.findings.length)
    throw new Error("Every generated finding needs a reference, including unchecked findings.");
  return verificationRecordSchema.parse({
    schemaVersion: 1,
    kind: "release_engineer_verification",
    ...identity,
    reviewReference: {
      publicPrUrl: parseGitHubPullRequestUrl(result.pullRequest.url).url,
      reviewedHeadSha: result.pullRequest.headSha,
      responseReceivedAt: receipt.receivedAt,
      interfaceRevision: receipt.interfaceRevision,
      includedFiles: result.coverage.includedFiles,
      totalChangedFiles: result.pullRequest.changedFileCount,
      partialContext: result.coverage.partial,
    },
    feedback,
    findings: result.review.findings.map((finding, index) => ({
      ...assessments[index], findingIndex: index, title: finding.title, file: finding.file,
    })),
    qualification: VERIFICATION_QUALIFICATION,
  });
}

export function reportText(result: AnalysisResponse, receipt: ReviewReceipt): string {
  const { pullRequest: pr, review, coverage, warnings } = result;
  const section = (title: string, entries: string[]) => [title, ...entries.map((entry) => `- ${entry}`), ""].join("\n");
  return [
    "RELEASE ENGINEER / REVIEW HANDOFF", "",
    "Generated decision support. Human verification remains necessary.",
    `Public PR: ${parseGitHubPullRequestUrl(pr.url).url}`,
    `Reviewed head: ${pr.headSha}`,
    `Response received in browser: ${receipt.receivedAt ?? "Not recorded"}`,
    `Interface revision: ${receipt.interfaceRevision ?? "Not supplied"}`,
    "Interface revision identifies the page build; the API does not provide its execution revision or served model.",
    `Changed files in context: ${coverage.includedFiles}/${pr.changedFileCount}`,
    `Context: ${coverage.partial ? "Partial" : "Within retrieval limits; full repository not inspected"}`,
    "", `PR title: ${pr.title}`, `Model risk assessment: ${review.overallRisk}`, `Model recommendation: ${review.verdict}`,
    "", review.summary, "",
    section("FINDINGS", review.findings.map((finding, index) =>
      `${index + 1}. ${finding.title} [${finding.severity}; ${finding.category}]\n  File: ${finding.file ?? "No specific file attributed"}\n  ${finding.explanation}\n  Recommendation: ${finding.recommendation}`)),
    section("TESTING GAPS", review.testingGaps),
    section("BREAKING CHANGES", review.breakingChanges),
    section("RECOMMENDED ACTIONS", review.recommendedActions),
    section("COVERAGE WARNINGS", warnings),
    section("LIMITATIONS", review.limitations),
    "Only supplied PR metadata and patches were reviewed. Tests were not run by Release Engineer.",
    "Check the pinned change, affected callers and your actual tests before a release decision.",
  ].join("\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

export function handoffFilename(result: AnalysisResponse, kind: "review" | "verification") {
  const pr = parseGitHubPullRequestUrl(result.pullRequest.url);
  const prefix = `${pr.owner}-${pr.repository}`.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 100);
  return `${prefix}-pr-${pr.number}-${result.pullRequest.headSha.slice(0, 8)}-${kind}.${kind === "review" ? "txt" : "json"}`;
}
