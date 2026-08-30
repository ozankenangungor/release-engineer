import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "@playwright/test";

const [base, destination] = process.argv.slice(2);
if (!base || !destination)
  throw new Error(
    "Usage: node scripts/browser-observation.mjs BASE_URL OUTPUT_DIRECTORY",
  );
const output = resolve(destination);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
});
const observations = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
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
      ]) {
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
      }
    });
    const page = await context.newPage();
    const errors = [],
      failures = [],
      attempts = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => failures.push(request.url()));
    // Safety boundary applies before navigation, for every viewport and origin.
    await context.route("**/api/analyze", (route) => {
      attempts.push(route.request().url());
      return route.abort();
    });
    const response = await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const metrics = await page.evaluate(() => ({
      ...window.__releaseAudit,
      overflow: document.documentElement.scrollWidth > innerWidth,
      formTop: document.querySelector("#analyze").getBoundingClientRect().top,
      submitBottom: document
        .querySelector('button[type="submit"]')
        .getBoundingClientRect().bottom,
      canvasCount: document.querySelectorAll("canvas").length,
      scene: document.querySelector("[data-scene]")?.getAttribute("data-scene"),
      js: performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".js"))
        .map((entry) => ({
          url: entry.name,
          bytes: entry.encodedBodySize,
          transfer: entry.transferSize,
        })),
    }));
    await page.screenshot({
      path: join(output, `home-${width}x${height}.png`),
    });
    observations.push({
      base,
      width,
      height,
      status: response.status(),
      ...metrics,
      errors,
      failures,
      attempts,
    });
    console.log(
      `${width}x${height}: LCP=${Math.round(metrics.lcp)}ms CLS=${metrics.cls.toFixed(4)} JS=${metrics.js.reduce((sum, entry) => sum + entry.bytes, 0)}B submitBottom=${Math.round(metrics.submitBottom)} canvas=${metrics.canvasCount}`,
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
