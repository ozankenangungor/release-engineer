import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeploymentProvenance } from "@/lib/deployment-provenance";
import { DeploymentProvenance } from "@/components/deployment-provenance";
import Evidence from "@/app/evidence/page";

// Synthetic identifiers for rendering tests only, never public deployment evidence.
const sha = "a1".repeat(20);
const commitUrl = `https://github.com/ozankenangungor/release-engineer/commit/${sha}`;
afterEach(() => vi.unstubAllEnvs());

describe("deployment revision provenance", () => {
  it("links the exact valid production SHA and only labels main when supplied", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", sha);
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "main");
    vi.stubEnv("VERCEL_ENV", "production");
    const html = renderToStaticMarkup(createElement(Evidence));
    expect(html).toContain("Current production revision");
    expect(html).toContain("Deployed from main");
    expect(html).toContain(`href="${commitUrl}"`);
    expect(html).toContain(`title="${sha}"`);
    expect(html).toContain(`${sha.slice(0, 12)}</code>`);
    expect(html).toContain(`/blob/${sha}/src/lib/claude.ts`);
    expect(html).toContain(`/blob/${sha}/docs/live-usage-evidence.md`);
  });

  it("distinguishes previews from production, including previews built from main", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", sha);
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const branch of ["review/startup-reviewer-clarity", "main"]) {
      vi.stubEnv("VERCEL_GIT_COMMIT_REF", branch);
      const html = renderToStaticMarkup(createElement(DeploymentProvenance));
      expect(html).toContain("Current preview revision");
      expect(html).toContain(`Source branch: ${branch}`);
      expect(html).toContain(`href="${commitUrl}"`);
      expect(html).not.toContain("Current production revision");
      expect(html).not.toContain("Deployed from main");
    }
  });

  it("does not infer a production environment or main branch", () => {
    expect(getDeploymentProvenance({ sha })).toMatchObject({
      title: "Current build revision",
      branchLabel: "Source branch not supplied",
    });
    expect(
      getDeploymentProvenance({ sha, environment: "production" }),
    ).toMatchObject({
      title: "Current production revision",
      branchLabel: "Source branch not supplied",
    });
    expect(
      getDeploymentProvenance({
        sha,
        branch: "other",
        environment: "production",
      })?.branchLabel,
    ).toBe("Source branch: other");
  });

  it("omits absent or invalid identifiers instead of treating main as a deployed SHA", () => {
    for (const value of [
      undefined,
      "",
      "main",
      "abc123",
      "g".repeat(40),
      "a".repeat(41),
      `${sha}\n`,
      ` ${sha}`,
      "../main",
      `\" onclick=\"alert(1)`,
    ]) {
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", value);
      vi.stubEnv("VERCEL_ENV", "production");
      expect(getDeploymentProvenance({ sha: value })).toBeNull();
      expect(renderToStaticMarkup(createElement(DeploymentProvenance))).toBe(
        "",
      );
    }
    const html = renderToStaticMarkup(createElement(Evidence));
    expect(html).not.toContain("Inspect commit");
    expect(html).toContain("/blob/main/docs/live-usage-evidence.md");
  });

  it("normalizes valid uppercase hexadecimal revisions", () => {
    expect(getDeploymentProvenance({ sha: sha.toUpperCase() })).toMatchObject({
      sha,
      commitUrl,
    });
  });
});
