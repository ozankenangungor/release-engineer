import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pullRequest, review } from "../fixtures";

// Every browser analysis request is intercepted, including on production.
// These tests cannot spend Claude credits and do not establish live inference.
test.beforeEach(async ({ context }) => {
  await context.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "TEST_STUB",
          message: "Stubbed service unavailable. Please try again later.",
        },
      }),
    });
  });
});

for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
] as const) {
  test(`homepage is usable at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    const failures: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => failures.push(request.url()));
    let calls = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/analyze")) calls++;
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Know what could break",
    );
    const submit = page.getByRole("button", {
      name: "Analyze PR",
      exact: true,
    });
    const box = await submit.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page
        .getByRole("navigation", { name: "Main", exact: true })
        .getByRole("link", { name: "About", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Load example PR" }).click();
    await expect(page.getByLabel("GitHub pull request URL")).toHaveValue(
      "https://github.com/rails/rails/pull/58968",
    );
    await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
    expect(calls).toBe(0);
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(a11y.violations).toEqual([]);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
    if (process.env.AUDIT_SCREENSHOT_DIR) {
      mkdirSync(process.env.AUDIT_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: join(
          process.env.AUDIT_SCREENSHOT_DIR,
          `home-${width}x${height}.png`,
        ),
        fullPage: false,
      });
    }
  });
}

test("validates locally, announces a service error and preserves the example", async ({
  page,
}) => {
  let calls = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analyze")) calls++;
  });
  await page.goto("/");
  const input = page.getByLabel("GitHub pull request URL");
  await input.fill("https://evil.example/pull/1");
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(
    page.getByRole("alert", { name: "Analysis error" }),
  ).toContainText("Enter a public GitHub PR URL");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toBeFocused();
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(
    page.getByRole("alert", { name: "Analysis error" }),
  ).toContainText("Stubbed service unavailable");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(input).toHaveValue("https://github.com/rails/rails/pull/58968");
  expect(calls).toBe(1);
});

for (const [status, message] of [
  [429, "limiting requests"],
  [504, "took too long"],
  [502, "unreadable response"],
] as const) {
  test(`handles a non-JSON ${status} platform response`, async ({ page }) => {
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        status,
        contentType: "text/html",
        body: "<h1>Hosting error</h1>",
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Load example PR" }).click();
    await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
    await expect(
      page.getByRole("alert", { name: "Analysis error" }),
    ).toContainText(message);
    await expect(
      page.getByRole("alert", { name: "Analysis error" }),
    ).not.toContainText("Unexpected token");
  });
}

test("handles network failure and rejects invalid reports", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(
    page.getByRole("alert", { name: "Analysis error" }),
  ).toContainText("Check your connection");
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ json: { review: "invalid" } }),
  );
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(
    page.getByRole("alert", { name: "Analysis error" }),
  ).toContainText("could not be validated");
  await expect(
    page.getByRole("region", { name: "Completed release review" }),
  ).toHaveCount(0);
});

test("shows loading and times out without retrying", async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  await page.route("**/api/analyze", (route) => {
    calls++;
    return new Promise<void>(() => {
      void route;
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Retrieving GitHub changes",
  );
  await expect(page.getByRole("button", { name: "Analyzing…" })).toBeDisabled();
  await page.clock.fastForward(126_000);
  await expect(
    page.getByRole("alert", { name: "Analysis error" }),
  ).toContainText("took too long or was interrupted");
  expect(calls).toBe(1);
});

test("renders a validated stubbed report, coverage warnings and focus on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const pr = pullRequest();
  const {
    files: _files,
    body: _body,
    filesTruncated: _truncated,
    ...publicPr
  } = pr;
  void _files;
  void _body;
  void _truncated;
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        pullRequest: publicPr,
        review: {
          ...review(),
          verdict: "review",
          limitations: [
            "Stubbed test report. Full repository not inspected; tests were not run.",
          ],
        },
        coverage: {
          totalFiles: 2,
          retrievedFiles: 2,
          includedFiles: 1,
          truncatedPatches: 0,
          missingPatches: 1,
          descriptionTruncated: false,
          filesNotRetrieved: false,
          partial: true,
        },
        warnings: ["One changed-file patch is unavailable (test stub)."],
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  const result = page.locator(".completed-report");
  await expect(result).toBeFocused();
  await expect(result).toContainText("Review before merging");
  await expect(result).toContainText("One changed-file patch is unavailable");
  await expect(result).toContainText(
    "No issue detected in the supplied context",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

for (const width of [1440, 360]) {
  test(`public routes, social metadata and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of [
      "/about",
      "/evidence",
      "/case-studies",
      "/case-studies/rails-doc-typo-58968",
      "/privacy",
      "/terms",
    ]) {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response!.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://releaseengineer.tech${path}`,
      );
      const title = await page.title();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        title,
      );
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
        "content",
        title,
      );
      expect(
        await page.locator('meta[name="description"]').getAttribute("content"),
      ).toBeTruthy();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test("keyboard navigation, free preview and reduced motion work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const example = page.getByRole("button", { name: "Load example PR" });
  for (
    let i = 0;
    i < 12 &&
    !(await example.evaluate((node) => node === document.activeElement));
    i++
  ) {
    await page.keyboard.press("Tab");
  }
  await expect(example).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  await page.getByRole("link", { name: "See a sample report" }).click();
  await expect(
    page.getByText("Illustrative example — not a live analysis."),
  ).toBeVisible();
  await page
    .getByText("Missing tests & suggested human checks", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Missing test coverage", exact: true }),
  ).toBeVisible();
  await page.getByText("Explore the review pipeline", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable optional animation" }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("the optional scene falls back when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof getContext>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByText("Explore the review pipeline", { exact: true }).click();
  await page.getByRole("button", { name: "Enable optional animation" }).click();
  await page.waitForTimeout(800);
  await expect(page.locator("[data-scene]")).toHaveAttribute(
    "data-scene",
    "static",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(page.locator("[data-motion-active]")).toHaveAttribute(
    "data-motion-active",
    "false",
  );
  expect(errors).toEqual([]);
});

test("robots, sitemap, social image and internal links are accessible", async ({
  page,
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    "Sitemap: https://releaseengineer.tech/sitemap.xml",
  );
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(
    "https://releaseengineer.tech/evidence",
  );
  const image = await request.get("/opengraph-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const links = new Set<string>();
  for (const path of [
    "/",
    "/about",
    "/evidence",
    "/case-studies",
    "/case-studies/rails-doc-typo-58968",
    "/privacy",
    "/terms",
  ]) {
    await page.goto(path);
    for (const href of await page
      .locator('a[href^="/"], a[href^="#"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("href")!),
      )) {
      const [target, fragment] = href.split("#");
      if (target) links.add(target);
      if (fragment && (!target || target === path))
        expect(await page.locator(`[id="${fragment}"]`).count()).toBe(1);
    }
  }
  for (const path of links)
    expect((await request.get(path)).status()).toBe(200);
});

test.describe("server-rendered public content", () => {
  test.use({ javaScriptEnabled: false });
  test("the product, preview and evidence are readable without JavaScript", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("Illustrative example — not a live analysis."),
    ).toBeVisible();
    await expect(page.locator("noscript p")).toBeVisible();
    await expect(page.locator("noscript p")).toContainText(
      "Enable JavaScript to submit a pull request",
    );
    await page
      .getByRole("navigation", { name: "Main", exact: true })
      .getByRole("link", { name: "Evidence", exact: true })
      .click();
    await expect(
      page.getByText("22 PASS / 10 FAIL", { exact: false }),
    ).toBeVisible();
  });
});
