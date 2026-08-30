import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import About from "@/app/about/page";
import Evidence from "@/app/evidence/page";
import Privacy from "@/app/privacy/page";
import Terms from "@/app/terms/page";
import { ReportPreview } from "@/components/report-preview";
import { analysisResponseSchema } from "@/lib/review-schema";

const render = (Page: () => React.ReactNode) =>
  renderToStaticMarkup(createElement(Page));
describe("product clarity and evidence integrity", () => {
  it("explains input, Claude and output before the working form, with a free preview", () => {
    const html = render(Home);
    expect(html).toMatch(/<h1[^>]*>Know what could break/);
    expect(html).toContain("Analyze a public GitHub pull request with Claude");
    expect(html).toContain(
      "potential release risks, missing tests and breaking changes",
    );
    expect(html).toContain('href="#report-preview"');
    expect(html).toContain('href="/evidence"');
    expect(html).toContain('id="pr-url"');
    expect(html.indexOf('id="analyze"')).toBeLessThan(
      html.indexOf('id="report-preview"'),
    );
    expect(html).not.toContain("<blockquote>");
  });
  it("keeps the authored preview separate from live and founder evidence", () => {
    const html = render(ReportPreview);
    expect(html).toContain("Illustrative example — not a live analysis.");
    expect(html).toContain("Partial · Some files omitted");
    expect(html).toContain("tests were not run");
    expect(html).toContain("Verify the API contract");
    expect(html).not.toMatch(
      /github.com|REVIEWED HEAD SHA|CLAUDE \/ STRUCTURED REVIEW/,
    );
    expect(analysisResponseSchema.safeParse({ preview: html }).success).toBe(
      false,
    );
  });
  it("states the individual operator and unincorporated status consistently", () => {
    for (const Page of [Home, About, Evidence, Privacy, Terms]) {
      const html = render(Page)
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ");
      expect(html).toContain("Ozan Kenan Güngör");
      expect(html).toContain("Ankara, Türkiye");
      expect(html).toContain(
        "No legal company has been incorporated or registered",
      );
      expect(html).not.toMatch(
        /THE COMPANY|PRODUCT COMPANY|startup founded|These company facts/,
      );
    }
    const readme = readFileSync(
      new URL("../README.md", import.meta.url),
      "utf8",
    );
    expect(readme).toContain("launched in **October 2026**");
    expect(readme).toContain(
      "No legal company has been incorporated or registered",
    );
  });
  it("retains dated failures and approved feedback at its new destination", () => {
    const html = render(Evidence);
    expect(html).toContain('id="developer-feedback"');
    expect(html.match(/<blockquote>/g)).toHaveLength(3);
    expect(html).toContain("22 PASS / 10 FAIL");
    expect(html).toContain("one critical violation remaining");
    expect(render(About)).toContain('href="/evidence#developer-feedback"');
  });
});
