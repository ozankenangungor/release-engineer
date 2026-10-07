import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "../src/app/layout";
import About from "../src/app/about/page";
import Home from "../src/app/page";

const html = renderToStaticMarkup(createElement(RootLayout, null, null));
const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const graph = (JSON.parse(script![1]!) as {
  "@graph": Record<string, unknown>[];
})["@graph"];

describe("public identity", () => {
  it("keeps the Google verification token and production metadata intact", () => {
    expect(metadata.verification).toEqual({
      google: "Q6JeeJ0ggduEaYxk6bkgjARI7CQn9a8vbBMz5wh7G4E",
    });
    expect(metadata.metadataBase?.toString()).toBe("https://releaseengineer.tech/");
    expect(metadata.alternates?.canonical).toBe("./");
  });

  it("publishes consistent month-level identity in normal homepage and About HTML", () => {
    const organization = graph.find(node => node["@type"] === "Organization")!;
    const founder = graph.find(node => node["@type"] === "Person")!;
    expect(organization.foundingDate).toBe("2026-10");
    for (const Page of [Home, About]) {
      const page = renderToStaticMarkup(createElement(Page));
      expect(page).toContain("October 2026");
      expect(page).toContain(String(founder.name));
      expect(page).toContain("Ankara, Türkiye");
      expect(page).toContain(`href="mailto:${organization.email}"`);
    }
  });

  it("renders one parseable graph with unique, resolving identity relationships", () => {
    expect(html.match(/type="application\/ld\+json"/g)).toHaveLength(1);
    expect(graph.map(node => node["@type"]).sort()).toEqual([
      "Organization", "Person", "SoftwareApplication", "WebSite",
    ]);
    const ids = new Set(graph.map(node => node["@id"]));
    expect(ids.size).toBe(graph.length);
    function checkReferences(value: unknown) {
      if (!value || typeof value !== "object") return;
      if ("@id" in value) expect(ids.has(value["@id"])).toBe(true);
      for (const entry of Object.values(value)) checkReferences(entry);
    }
    graph.forEach(checkReferences);
    expect(graph.find(node => node["@type"] === "Organization")?.founder)
      .toEqual({ "@id": "https://releaseengineer.tech/#founder" });
    expect(graph.find(node => node["@type"] === "SoftwareApplication")?.provider)
      .toEqual({ "@id": "https://releaseengineer.tech/#organization" });
  });

  it("makes the evaluation evidence and its limits visible in the About HTML", () => {
    const page = renderToStaticMarkup(createElement(About));
    expect(page).toContain("32 original synthetic pull-request cases");
    expect(page).toContain("Two manually dispatched live Claude runs");
    expect(page).toContain("22 passing cases, 10 failing cases and one critical");
    expect(page).toContain("synthetic observations are not real-world accuracy or external beta");
    expect(page).not.toMatch(/no live.*baseline/i);
    expect(page).toContain(
      'href="https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md"',
    );
    expect(page).toContain(
      'href="https://github.com/ozankenangungor/release-engineer/blob/main/evals/README.md"',
    );
    expect(page).toMatch(/<time datetime="2026-10">October 2026<\/time>/i);
  });

  it("exposes the existing security policy without publishing unsupported beta evidence", () => {
    expect(html).toContain(
      'href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer"',
    );
    const page = renderToStaticMarkup(createElement(About));
    expect(page).toContain("The early beta is available for testing");
    expect(page).not.toContain("External developers have tested");
  });

  it("provides a server-rendered beta path with private feedback and separate publication consent", () => {
    const home = renderToStaticMarkup(createElement(Home));
    const about = renderToStaticMarkup(createElement(About));
    expect(home).toContain('href="/about#beta"');
    expect(about).toContain('<section id="beta">');
    expect(about).toContain('href="/"');
    expect(about).toContain('href="mailto:founder@releaseengineer.tech"');
    expect(about).toContain("not private");
    expect(about).toContain("code, secrets or sensitive vulnerability details");
    expect(about).toContain("Feedback stays private");
    expect(about).toContain("consent to publish your name or a quote");
  });
});
