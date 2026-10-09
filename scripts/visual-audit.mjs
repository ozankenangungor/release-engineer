import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "@playwright/test";
const [base, destination] = process.argv.slice(2);
if (!base || !destination)
  throw new Error(
    "Usage: node scripts/visual-audit.mjs BASE_URL OUTPUT_DIRECTORY",
  );
const output = resolve(destination);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
});
const observations = [];
try {
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => {
      window.__releaseAudit = { lcp: 0, cls: 0, longTasks: [] };
      for (const type of [
        "largest-contentful-paint",
        "layout-shift",
        "longtask",
      ])
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (type === "largest-contentful-paint")
              window.__releaseAudit.lcp = entry.startTime;
            if (type === "layout-shift" && !entry.hadRecentInput)
              window.__releaseAudit.cls += entry.value;
            if (type === "longtask")
              window.__releaseAudit.longTasks.push(entry.duration);
          }
        }).observe({ type, buffered: true });
    });
    const attempts = [],
      errors = [],
      failures = [];
    // Installed before navigation: no screenshot can initiate paid inference.
    await context.route("**/api/analyze", (route) => {
      attempts.push(route.request().url());
      return route.fulfill({
        status: 503,
        json: {
          error: {
            code: "VISUAL_TEST_STUB",
            message:
              "Illustrative service error for browser verification. Please try again later.",
          },
        },
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => failures.push(r.url()));
    const response = await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
      const mark = performance.getEntriesByName("release-graph-request")[0]
        ?.startTime;
      const resources = performance
        .getEntriesByType("resource")
        .filter((e) => new URL(e.name).pathname.endsWith(".js"));
      return {
        ...window.__releaseAudit,
        overflow: document.documentElement.scrollWidth > innerWidth,
        submitBottom: document
          .querySelector('button[type="submit"]')
          .getBoundingClientRect().bottom,
        canvasCount: document.querySelectorAll("canvas").length,
        scene: document
          .querySelector("[data-scene]")
          ?.getAttribute("data-scene"),
        graphRequest: mark ?? null,
        graphReady:
          performance.getEntriesByName("release-graph-ready")[0]?.startTime ??
          null,
        initialJs: resources
          .filter((e) => mark === undefined || e.startTime < mark)
          .reduce((sum, e) => sum + e.encodedBodySize, 0),
        deferredJs: resources
          .filter((e) => mark !== undefined && e.startTime >= mark)
          .reduce((sum, e) => sum + e.encodedBodySize, 0),
        js: resources.map((e) => ({
          url: e.name,
          bytes: e.encodedBodySize,
          transfer: e.transferSize,
          start: e.startTime,
        })),
      };
    });
    await page.screenshot({
      path: join(output, `home-${width}x${height}.png`),
    });
    const pause = page.getByRole("button", {
      name: "Pause animation",
      exact: true,
    });
    if (await pause.count()) await pause.click();
    await page.screenshot({
      path: join(output, `full-${width}x${height}.png`),
      fullPage: true,
    });
    if (width === 1440 || width === 390) {
      for (const [label, selector] of [
        ["workspace", "#report-preview"],
        ["process", "#how-it-works"],
        ["trust", "#engineering-trust"],
        ["footer", ".site-footer"],
      ]) {
        const section = page.locator(selector);
        if (await section.count()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(800);
          await section.screenshot({
            path: join(output, `${label}-${width}.png`),
          });
        }
      }
      await page.goto(base, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Load example PR" }).click();
      await page
        .getByRole("button", { name: "Analyze PR", exact: true })
        .click();
      await page.getByRole("alert", { name: "Analysis error" }).waitFor();
      await page.screenshot({ path: join(output, `error-${width}.png`) });
      if (width === 390) {
        const menu = page.getByLabel("Toggle navigation");
        if (await menu.count()) {
          await menu.scrollIntoViewIfNeeded();
          await menu.click();
          await page.screenshot({ path: join(output, "mobile-menu.png") });
        }
      }
      for (const route of [
        "about",
        "evidence",
        "privacy",
        "terms",
        "case-studies/rails-doc-typo-58968",
      ]) {
        const routeResponse = await page.goto(new URL("/" + route, base).href, {
          waitUntil: "networkidle",
        });
        await page.screenshot({
          path: join(output, `${route.replaceAll("/", "-")}-${width}.png`),
        });
        if (width === 1440)
          await page.screenshot({
            path: join(output, `${route.replaceAll("/", "-")}-full.png`),
            fullPage: true,
          });
        if (routeResponse.status() !== 200)
          errors.push(`${route}: ${routeResponse.status()}`);
      }
    }
    observations.push({
      base,
      width,
      height,
      status: response.status(),
      ...metrics,
      errors,
      failures,
      interceptedAnalysisRequests: attempts.length,
    });
    console.log(
      `${width}x${height}: LCP=${Math.round(metrics.lcp)}ms CLS=${metrics.cls.toFixed(4)} initial=${metrics.initialJs}B deferred=${metrics.deferredJs}B scene=${metrics.scene} submit=${Math.round(metrics.submitBottom)} overflow=${metrics.overflow}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  join(output, "measurements.json"),
  JSON.stringify(observations, null, 2) + "\n",
);
