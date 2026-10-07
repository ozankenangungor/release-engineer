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
import Feedback from "@/app/feedback/page";
import sitemap from "@/app/sitemap";

// Publication-approved names, roles and exact wording supplied by the founder.
// Keep this allowlist explicit so adding private or unapproved fields fails review.
const approvedFeedback = [
  ["Daniel Reyes", "Backend Developer", "Caught a missing validate=True in my base64 secret decoding right after I wrote the code. The tool doesn't run tests, and it says so — that honesty is why I trust the rest of the report."],
  ["Megan Carter", "Full Stack Developer", "I hadn't noticed my handler changed a 422 to a 400 for malformed JSON. The breaking changes section caught it before merge. Small diff, real contract change."],
  ["Tyler Brooks", "Open source contributor", "The fail-open rollout was intentional on my part, but the suggested ALLOW_UNSIGNED_WEBHOOKS flag was a better design than mine. I shipped it in my next PR."],
  ["Sarah Lindqvist", "Staff Engineer", "Good second perspective on a security change. It flagged the untested edge cases honestly instead of pretending full coverage. Saved me an hour of self-review."],
  ["Brandon Mitchell", "SDK Maintainer", "I maintain a small TypeScript SDK and used it on an API contract change. The report correctly identified which callers were outside the review boundary — that limitation section is the best part."],
  ["Emily Foster", "QA Lead", "The testing gaps list basically became my test plan. Three of the five suggested tests found their way into our suite before merge."],
  ["James Carter", "DevOps Engineer", "The recommendation about proxy forwarding raw webhook bodies saved us a confusing production debug session. Would love more explicit debugging guidance though — it took me a moment to connect the dots."],
  ["Lauren Hayes", "Backend Developer", "Mixed experience: one finding I already knew, two I hadn't caught. Net useful. The limits being stated up front is what makes the useful findings credible."],
  ["Kevin Murphy", "Indie hacker", "First time trying it on my own PR. It read my code better than some human reviewers I've had. Downloaded the report and used it as a checklist."],
  ["Marc Dubois", "Tech Lead", "We now run Release Engineer on every public PR before assigning a reviewer. It doesn't replace review, but it makes the first pass much faster."],
  ["Rachel Sullivan", "API Engineer", "Found an untested error branch in my webhook signature verification that would have failed closed in production. Caught it in the report, verified in the code, fixed before merge."],
  ["Jason Myers", "SaaS founder", "As a solo founder shipping fast, this is my pre-merge sanity check. It won't catch everything and says so — which is exactly the right amount of trust to give it."],
  ["Alex Chen", "Platform Engineer", "The findings come with file and line references, so verification took minutes instead of a full re-read of the diff. That structure matters more than the AI itself."],
  ["Ashley Coleman", "Backend Developer", "One finding was slightly too broad — the risk only applied under a config that we never use. Still, checking it forced me to document that assumption. Better than no review."],
  ["Derek Watson", "Open source maintainer", "Used it on a dependency upgrade PR. Surface-level but useful triage: what changed, what might break, what to test. Exactly what I need for boring-but-risky PRs."],
  ["Hannah Weber", "Senior Developer", "The reviewed head SHA is pinned in the report, so I know exactly which version the findings apply to. More release tools should do this."],
  ["Chris Donovan", "Full Stack Developer", "Mixed on one report, clearly useful on the next. When it's useful it's rocket fuel for review. When it's not, the honest limits tell you why. Second one convinced me."],
  ["Marcus Johnson", "Engineering Manager", "I don't merge my team's PRs anymore without seeing the Release Engineer report attached. Not because it's always right — because it makes the review conversation concrete."],
  ["Madison Reed", "Junior Developer", "Taught me what to look for in diffs — breaking changes, status code contracts, untested branches. I learned more reviewing its findings than from my last code review cycle."],
  ["Nathan Brooks", "Backend Developer", "My second time using it. First report had one wrong finding; second was spot on and the dispositions were clearly separated. The consistency is what will make me a regular user."],
  ["Early Beta Tester", "Software Engineer", "Thanks, useful tool. The structured analysis gives a quick sanity check before merging."],
  ["Beta Developer", "Open Source Contributor", "It was useful."],
  ["Early Tester", "Full-Stack Developer", "Useful tool to get a structured second perspective on pull requests."],
] as const;

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

describe("publication boundaries", () => {
  it("publishes only the approved names, aliases, roles and exact quotes, with a three-quote evidence selection", () => {
    expect(testimonials.map((item) => [item.displayName, item.role, item.quote])).toEqual(approvedFeedback);
    expect(new Set(testimonials.map((item) => item.id)).size).toBe(23);
    const html = renderToStaticMarkup(createElement(Testimonials));
    expect(html.match(/<blockquote>/g)).toHaveLength(3);
    for (const [index, item] of testimonials.entries()) {
      expect(item.attribution).toBe(index < 20 ? "external-user" : "external-beta");
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
    }
    for (const item of testimonials.slice(0, 3)) {
      expect(html).toContain(escapeText(item.quote));
      expect(html).toContain(item.displayName);
    }
    expect(Array.from(html.matchAll(/href="([^"]+)"/g), (match) => match[1])).toEqual(["/feedback"]);
    expect(html).not.toMatch(/@|stars|Trusted by|Loved by/);
    expect(html).toContain("Exact quotes published with permission");
    expect(html).toContain("Names, aliases and roles are publication-approved");
    expect(html).toContain("contact details and PR links are not disclosed");
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
  it("keeps the dedicated feedback page within the approved publication scope", () => {
    const html = renderToStaticMarkup(createElement(Feedback));
    expect(html.match(/<blockquote>/g)).toHaveLength(23);
    for (const item of testimonials) {
      expect(html).toContain(escapeText(item.quote));
      expect(html).toContain(item.displayName);
      expect(html).toContain(item.role);
    }
    expect(html).toContain(
      "Quotes published with permission, using approved names and roles.",
    );
    expect(html).not.toMatch(/AggregateRating|ratingValue|stars|Trusted by/);
    expect(sitemap().map((item) => item.url)).toContain(
      "https://releaseengineer.tech/feedback",
    );
  });
  it("introduces public evidence before synthetic evaluation without hiding failures", () => {
    const html = renderToStaticMarkup(createElement(Evidence));
    const headings = Array.from(
      html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g),
      (match) => match[1],
    );
    expect(headings).toEqual([
      "Working software, inspectable engineering.",
      "Public changes, checked against pinned sources.",
      "Approved developer feedback.",
      "rails/rails #58968",
      "Claude reasons. Application code sets the scope.",
      "Evaluation with failures in view.",
      "How live usage is measured.",
      "A founder, a public record, a way to contact us.",
      "Developer feedback.",
    ]);
    expect(html).toContain("22 PASS / 10 FAIL");
    expect(html).toContain("one critical violation remaining");
    expect(html).toContain("Metrics, failures, source runs &amp; provenance");
    expect(html).toContain("No Claude analysis or");
    expect(html).toContain("external developer session was performed");
    expect(html).toContain("/technical-walkthrough-kit.zip");
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
