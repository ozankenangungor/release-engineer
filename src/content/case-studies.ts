import { z } from "zod";
import { parseGitHubPullRequestUrl } from "@/lib/github-url";

const text = z.string().trim().min(1);
const sha = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export const caseStudySchema = z
  .strictObject({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: text,
    repository: text,
    prNumber: z.number().int().positive(),
    prUrl: z.string().url(),
    reviewedHeadSha: sha,
    productCommit: sha.optional(),
    observedAt: z.iso.date(),
    participationSource: z.enum(["external-tester", "founder-test"]),
    summary: text,
    surfaced: z.array(text).min(1),
    verification: text,
    verificationEvidence: z.array(z.url({ protocol: /^https$/ })).min(1),
    actionTaken: text.optional(),
    limitations: z.array(text).min(1),
    publishedWithPermission: z.literal(true),
  })
  .superRefine((value, ctx) => {
    try {
      const pr = parseGitHubPullRequestUrl(value.prUrl);
      if (
        `${pr.owner}/${pr.repository}` !== value.repository ||
        pr.number !== value.prNumber
      )
        ctx.addIssue({
          code: "custom",
          message: "PR identity must match its public source URL.",
        });
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "A public GitHub PR source is required.",
      });
    }
  });
export type CaseStudy = z.infer<typeof caseStudySchema>;

// Intentionally empty: no pinned, human-checked case evidence has been supplied.
// Drafts/consent records belong outside Git, not in this public source file.
const caseStudies: readonly CaseStudy[] = [];

export function getPublishedCaseStudies(): CaseStudy[] {
  // Failing closed avoids publishing incomplete records even after a content edit.
  return caseStudies.flatMap((item) => {
    const result = caseStudySchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}
