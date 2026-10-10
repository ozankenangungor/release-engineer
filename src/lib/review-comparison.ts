import { z } from "zod";
import { analysisResponseSchema, type AnalysisResponse } from "./review-schema";
import { verificationRecordSchema } from "./verification-record";
import { parseGitHubPullRequestUrl } from "./github-url";

export const MAX_COMPARISON_BYTES = 1_048_576;
const snapshotSchema = z.strictObject({
  kind: z.literal("release_engineer_review"),
  schemaVersion: z.literal(1),
  result: analysisResponseSchema,
});
export function reviewSnapshot(result: AnalysisResponse) {
  return snapshotSchema.parse({ kind: "release_engineer_review", schemaVersion: 1, result });
}
export type ComparisonInput = {
  url: string; head: string; partial: boolean; source: "report" | "verification";
  findings: { title: string; file: string | null }[];
};
export function parseComparisonInput(text: string): ComparisonInput {
  if (new TextEncoder().encode(text).byteLength > MAX_COMPARISON_BYTES)
    throw new Error("Choose a Release Engineer JSON file smaller than 1 MiB.");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  const snapshot = snapshotSchema.safeParse(data);
  if (snapshot.success) {
    const { pullRequest: pr, coverage, review } = snapshot.data.result;
    const ref = parseGitHubPullRequestUrl(pr.url);
    if (pr.owner !== ref.owner || pr.repository !== ref.repository || pr.number !== ref.number)
      throw new Error("The report's PR identity does not match its URL.");
    return { url: pr.url.replace(/\/$/, ""), head: pr.headSha, partial: coverage.partial,
      source: "report", findings: review.findings.map(({ title, file }) => ({ title, file })) };
  }
  const record = verificationRecordSchema.safeParse(data);
  if (record.success) {
    const ref = record.data.reviewReference;
    return { url: ref.publicPrUrl.replace(/\/$/, ""), head: ref.reviewedHeadSha,
      partial: ref.partialContext, source: "verification", findings: record.data.findings.map(({ title, file }) => ({ title, file })) };
  }
  throw new Error("Choose an exported Review JSON or Verification JSON from Release Engineer.");
}
export function compareReviews(previous: ComparisonInput, current: ComparisonInput) {
  if (previous.url !== current.url) throw new Error("Choose two records for the same public GitHub PR.");
  const key = (f: ComparisonInput["findings"][number]) => JSON.stringify([f.file, f.title.trim().toLowerCase()]);
  const before = new Set(previous.findings.map(key));
  const after = new Set(current.findings.map(key));
  return {
    sameHead: previous.head === current.head,
    partial: previous.partial || current.partial,
    rows: [
      ...current.findings.map((finding) => ({ ...finding,
        status: before.has(key(finding)) ? "reported_again" as const : "newly_reported" as const })),
      ...previous.findings.filter((finding) => !after.has(key(finding)))
        .map((finding) => ({ ...finding, status: "not_reported_again" as const })),
    ],
  };
}
