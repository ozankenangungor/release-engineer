import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { testimonials } from "@/content/testimonials";
import {
  caseStudySchema,
  getPublishedCaseStudies,
} from "@/content/case-studies";
import { Testimonials } from "@/components/testimonials";
import { CaseStudiesPreview } from "@/components/case-studies";
import sitemap from "@/app/sitemap";

describe("publication boundaries", () => {
  it("renders exactly the three approved quotes, aliases and roles without PR links or private identifiers", () => {
    expect(testimonials.map((item) => item.quote)).toEqual([
      "Thanks, useful tool. The structured analysis gives a quick sanity check before merging.",
      "It was useful.",
      "Useful tool to get a structured second perspective on pull requests.",
    ]);
    const html = renderToStaticMarkup(createElement(Testimonials));
    expect(html.match(/<blockquote>/g)).toHaveLength(3);
    for (const item of testimonials) {
      expect(item.attribution).toBe("external-beta");
      expect(item.permission).toBe("approved");
      expect(Object.keys(item).sort()).toEqual(
        [
          "id",
          "displayName",
          "role",
          "quote",
          "attribution",
          "permission",
        ].sort(),
      );
      expect(html).toContain(item.quote);
      expect(html).toContain(item.displayName);
    }
    expect(html).not.toMatch(/href=|@|stars|Trusted by|Loved by/);
  });
  it("publishes no unsupported case preview or sitemap route", () => {
    expect(getPublishedCaseStudies()).toEqual([]);
    expect(renderToStaticMarkup(createElement(CaseStudiesPreview))).toBe("");
    expect(sitemap().map((item) => item.url)).not.toContain(
      "https://releaseengineer.tech/case-studies",
    );
    expect(sitemap().map((item) => item.url)).toContain(
      "https://releaseengineer.tech/evidence",
    );
  });
  it("requires consent, matching pinned public PR identity, human verification and limitations", () => {
    // Synthetic schema input only, never production content or a real observation.
    const record = {
      slug: "test-only",
      title: "Schema test",
      repository: "owner/repo",
      prNumber: 1,
      prUrl: "https://github.com/owner/repo/pull/1",
      reviewedHeadSha: "a".repeat(40),
      observedAt: "2026-10-08",
      participationSource: "founder-test",
      summary: "Test input",
      surfaced: ["A possible risk"],
      verification: "Human checked a pinned contract; founder adjudication.",
      verificationEvidence: ["https://example.test/pinned-contract"],
      limitations: ["No runtime behavior established"],
      publishedWithPermission: true,
    };
    expect(caseStudySchema.safeParse(record).success).toBe(true);
    for (const overrides of [
      { publishedWithPermission: false },
      { reviewedHeadSha: "short" },
      { repository: "different/repo" },
      { verification: "" },
      { verificationEvidence: [] },
      { limitations: [] },
      { email: "private@example.test" },
    ])
      expect(
        caseStudySchema.safeParse({ ...record, ...overrides }).success,
      ).toBe(false);
  });
});
