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

// Founder-run observations are labeled explicitly and never presented as external validation.
// Drafts/consent records belong outside Git, not in this public source file.
const caseStudies: readonly CaseStudy[] = [
  {
    slug: "rails-doc-typo-58968",
    title: "Rails documentation typo fix",
    repository: "rails/rails",
    prNumber: 58968,
    prUrl: "https://github.com/rails/rails/pull/58968",
    reviewedHeadSha: "08dacc7fed6bd69e864ce66e00a5616f117c6427",
    observedAt: "2026-10-07",
    participationSource: "founder-test",
    summary:
      "In a founder-run production check, Release Engineer classified this one-file Rails documentation correction as low risk with no findings and explicit scope limitations.",
    surfaced: [
      "Low-risk assessment with no findings for a one-file, +1/-1 documentation change.",
      "The single changed file was fully represented in the supplied review context.",
      "The report explicitly stated that the full repository was not inspected and tests were not run.",
    ],
    verification:
      "The pinned public diff changes one documentation phrase from superusers to super_admins in guides/source/caching_with_rails.md. Rails maintainer kamipo merged the PR later the same day. This verifies the underlying change and public outcome, not Release Engineer's general accuracy.",
    verificationEvidence: [
      "https://github.com/rails/rails/pull/58968",
      "https://github.com/rails/rails/commit/08dacc7fed6bd69e864ce66e00a5616f117c6427",
      "https://github.com/rails/rails/commit/705fdc5a8c640f6a229febe9d795561574e30208",
    ],
    actionTaken:
      "Merged upstream by Rails maintainer kamipo on 2026-10-07. No maintainer action is attributed to Release Engineer.",
    limitations: [
      "This was a founder-run production check, not an external tester case or customer validation.",
      "The original generated report was not retained as a public artifact, and the exact Release Engineer product commit used for the run was not recorded.",
      "The later upstream merge does not prove model correctness or real-world accuracy.",
      "The review covered supplied PR metadata and patches only; it did not inspect the full repository or run tests.",
    ],
    publishedWithPermission: true,
  },
];

export function getPublishedCaseStudies(): CaseStudy[] {
  // Failing closed avoids publishing incomplete records even after a content edit.
  return caseStudies.flatMap((item) => {
    const result = caseStudySchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}
