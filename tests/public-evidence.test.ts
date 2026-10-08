import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { testimonials } from "@/content/testimonials";
import {
  caseStudySchema,
  getPublishedCaseStudies,
} from "@/content/case-studies";
import { Testimonials } from "@/components/testimonials";
import { FeaturedPublicObservation } from "@/components/case-studies";
import Evidence from "@/app/evidence/page";
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
    expect(html).toContain("Exact quotes published with permission");
    expect(html).toContain("Display aliases are publication-approved");
    expect(html).toContain("private identities and PR links are not disclosed");
  });
  it("publishes the pinned founder-run Rails observation without calling it external validation", () => {
    const studies = getPublishedCaseStudies();
    expect(studies).toHaveLength(1);
    expect(studies[0]).toMatchObject({
      slug: "rails-doc-typo-58968",
      repository: "rails/rails",
      prNumber: 58968,
      reviewedHeadSha: "08dacc7fed6bd69e864ce66e00a5616f117c6427",
      participationSource: "founder-test",
      publishedWithPermission: true,
    });
    expect(studies[0]?.productCommit).toBeUndefined();
    const html = renderToStaticMarkup(createElement(FeaturedPublicObservation));
    expect(html).toContain("rails/rails #58968");
    expect(html).toContain("Founder test — not external validation.");
    expect(html).toContain(studies[0]!.reviewedHeadSha);
    expect(html).toContain(
      "The upstream merge does not establish model accuracy",
    );
    expect(html).toContain("original report and exact product revision");
    expect(html).not.toContain("EXTERNAL TESTER");
    const urls = sitemap().map((item) => item.url);
    expect(urls).toContain("https://releaseengineer.tech/case-studies");
    expect(urls).toContain(
      "https://releaseengineer.tech/case-studies/rails-doc-typo-58968",
    );
    expect(urls).toContain("https://releaseengineer.tech/evidence");
  });
  it("introduces public evidence before synthetic evaluation without hiding failures", () => {
    const html = renderToStaticMarkup(createElement(Evidence));
    const headings = Array.from(
      html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g),
      (match) => match[1],
    );
    expect(headings).toEqual([
      "Working software, inspectable engineering.",
      "Approved early developer feedback.",
      "rails/rails #58968",
      "Claude reasons. Application code sets the scope.",
      "Evaluation with failures in view.",
      "How live usage is measured.",
      "A founder, a public record, a way to contact us.",
    ]);
    expect(html).toContain("22 PASS / 10 FAIL");
    expect(html).toContain("one critical violation remaining");
    expect(html).toContain("Metrics, failures, source runs &amp; provenance");
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
