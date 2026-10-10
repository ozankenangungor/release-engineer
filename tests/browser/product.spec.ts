import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
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
      "Understand the change",
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
    await expect(page.locator(".hero-stage .scene-fallback")).toBeAttached();
    if (width >= 1024) {
      await expect(
        page
          .getByRole("navigation", { name: "Main", exact: true })
          .getByRole("link", { name: "About", exact: true }),
      ).toBeVisible();
    } else {
      await expect(page.locator("canvas")).toHaveCount(0);
      await page.getByLabel("Toggle navigation").click();
      await expect(
        page
          .getByRole("navigation", { name: "Mobile", exact: true })
          .getByRole("link", { name: "About", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }
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
      "/pilot",
      "/evidence",
      "/feedback",
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
  await page.getByRole("tab", { name: "Next steps", exact: true }).click();
  await page
    .getByText("Missing tests & suggested human checks", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Missing test coverage", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable optional animation" }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("the visible graph falls back when WebGL is unavailable", async ({
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
  await page.waitForTimeout(1500);
  await expect(page.locator("[data-scene]")).toHaveAttribute(
    "data-scene",
    "static",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".scene-fallback")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeEnabled();
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
  expect(await sitemap.text()).toContain(
    "https://releaseengineer.tech/feedback",
  );
  const image = await request.get("/opengraph-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const links = new Set<string>();
  for (const path of [
    "/",
    "/about",
    "/pilot",
    "/evidence",
    "/feedback",
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
  test.use({ javaScriptEnabled: false, colorScheme: "light" });
  test("the black theme is readable on public routes before hydration with light OS preferences", async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/about",
      "/evidence",
      "/feedback",
      "/pilot",
      "/case-studies",
      "/case-studies/rails-doc-typo-58968",
      "/privacy",
      "/terms",
    ]) {
      await page.goto(path);
      await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
        "content",
        "dark",
      );
      const colors = await page.evaluate(() => {
        const style = getComputedStyle(document.body);
        const rgb = (value: string) =>
          value.match(/\d+/g)!.slice(0, 3).map(Number);
        return {
          lightPreference: matchMedia("(prefers-color-scheme: light)").matches,
          scheme: getComputedStyle(document.documentElement).colorScheme,
          background: rgb(style.backgroundColor),
          foreground: rgb(style.color),
        };
      });
      expect(colors.lightPreference).toBe(true);
      expect(colors.scheme).toBe("dark");
      expect(Math.max(...colors.background)).toBeLessThan(32);
      expect(Math.min(...colors.foreground)).toBeGreaterThan(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

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

for (const width of [1440, 390]) {
  test(`feedback is reachable by keyboard and returns to the working analyzer at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    if (width < 1024) {
      await page.getByLabel("Toggle navigation").focus();
      await page.keyboard.press("Enter");
    }
    const navigation = page.getByRole("navigation", {
      name: width < 1024 ? "Mobile" : "Main",
      exact: true,
    });
    await navigation.getByRole("link", { name: "Feedback", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "In developers’ words.",
    );
    if (width < 1024)
      await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
    await expect(page.locator("main blockquote")).toHaveCount(23);
    await expect(page.locator(".feedback-review-card")).toHaveCount(23);
    await expect(page.locator(".feedback-author-name")).toHaveText([
      "Daniel Reyes", "Megan Carter", "Tyler Brooks", "Sarah Lindqvist",
      "Brandon Mitchell", "Emily Foster", "James Carter", "Lauren Hayes",
      "Kevin Murphy", "Marc Dubois", "Rachel Sullivan", "Jason Myers",
      "Alex Chen", "Ashley Coleman", "Derek Watson", "Hannah Weber",
      "Chris Donovan", "Marcus Johnson", "Madison Reed", "Nathan Brooks",
      "Early Beta Tester", "Beta Developer", "Early Tester",
    ]);
    await expect(page.locator("main")).toContainText(
      "Caught a missing validate=True in my base64 secret decoding right after I wrote the code.",
    );
    await expect(page.locator("main")).toContainText(
      "The structured analysis gives a quick sanity check before merging.",
    );
    await page.getByRole("link", { name: "Read their feedback" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/feedback#perspectives$/);
    await expect(
      page.getByRole("heading", { name: "Developer perspectives", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Share your feedback", exact: true }),
    ).toHaveAttribute(
      "href",
      "mailto:founder@releaseengineer.tech?subject=Release%20Engineer%20feedback",
    );
    await page
      .getByRole("main")
      .getByRole("link", { name: "Analyze a public PR", exact: true })
      .click();
    await expect(page).toHaveURL(/\/#analyze$/);
    await expect(page.getByLabel("GitHub pull request URL")).toBeInViewport();
    await page.getByRole("button", { name: "Load example PR" }).click();
    await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
    await expect(page.getByLabel("GitHub pull request URL")).not.toBeEmpty();
  });
}

test("the diff connects to its finding and report tabs support keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  const changedLine = page.getByRole("button", {
    name: "Select changed response line to inspect its risk",
  });
  await changedLine.click();
  await expect(changedLine).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".risk-view")).toHaveAttribute(
    "data-highlighted",
    "true",
  );
  const risk = page.getByRole("tab", { name: "Risk", exact: true });
  await risk.focus();
  await page.keyboard.press("ArrowRight");
  const evidence = page.getByRole("tab", { name: "Evidence", exact: true });
  await expect(evidence).toBeFocused();
  await expect(evidence).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Caller code and the intended API contract",
  );
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Next steps", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Run a response compatibility test",
  );
  await page
    .getByText("Missing tests & suggested human checks", { exact: true })
    .click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "does not establish that the repository has no such tests",
  );
  await expect(page.getByLabel("Example coverage limitation")).toContainText(
    "tests were not run",
  );
  await changedLine.click();
  await expect(changedLine).toHaveAttribute("aria-pressed", "false");
  await expect(risk).toHaveAttribute("aria-selected", "true");
});

test("the response playground checks every example contract and clears stale results", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/")) requests++;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open response playground", exact: true })
    .click();
  const result = page.getByRole("status", { name: "Example caller result" });
  const payload = page.getByLabel("Example response payload");
  const caller = page.getByLabel("Example caller", { exact: true });
  for (const [version, kind, compatible] of [
    ["Before change", "array", true],
    ["After change", "array", false],
    ["After change", "envelope", true],
    ["Before change", "envelope", false],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(`^${version}`) }).click();
    await caller.selectOption(kind);
    await expect(result).toContainText("Run the example");
    const data = JSON.parse(await payload.innerText());
    expect(Array.isArray(data)).toBe(version === "Before change");
    await page
      .getByRole("button", { name: "Run example caller", exact: true })
      .click();
    await expect(result).toHaveAttribute(
      "data-outcome",
      compatible ? "compatible" : "incompatible",
    );
    await expect(result).toContainText(
      compatible
        ? "Compatible in this example"
        : "Incompatible in this example",
    );
    if (compatible) await expect(result).toContainText('["v1.8.0","v1.9.0"]');
    else await expect(result).not.toContainText('["v1.8.0","v1.9.0"]');
  }
  await expect(
    page.getByText(
      "Browser-only example data. No PR code or repository tests are run.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show source diff", exact: true })
    .click();
  await expect(page.getByLabel("Illustrative API response diff")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run example caller", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Open response playground", exact: true })
    .click();
  await expect(caller).toHaveValue("envelope");
  await expect(
    page.getByRole("button", { name: /^Before change/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(result).toHaveAttribute("data-outcome", "incompatible");
  expect(requests).toBe(0);
});

test("the example checklist retains local selections and reset clears the whole workspace", async ({
  page,
}) => {
  await page.goto("/");
  const preview = page.locator("#report-preview");
  await preview
    .getByRole("button", { name: "Open review checklist", exact: true })
    .click();
  const progress = preview.getByRole("status", {
    name: "Example checklist progress",
  });
  await expect(progress).toContainText("0 of 3");
  const checks = preview.getByRole("checkbox");
  for (const check of await checks.all()) await check.check();
  await expect(progress).toContainText(
    "3 of 3 example steps selected · Human verification still required.",
  );
  await preview.getByRole("tab", { name: "Evidence", exact: true }).click();
  await preview.getByRole("tab", { name: "Next steps", exact: true }).click();
  for (const check of await checks.all()) await expect(check).toBeChecked();
  await checks.nth(1).uncheck();
  await expect(progress).toContainText("2 of 3");
  await preview
    .getByRole("button", { name: "Open response playground", exact: true })
    .click();
  await preview
    .getByLabel("Example caller", { exact: true })
    .selectOption("envelope");
  await preview
    .getByRole("button", { name: "Run example caller", exact: true })
    .click();
  await expect(
    preview.getByRole("status", { name: "Example caller result" }),
  ).toHaveAttribute("data-outcome", "compatible");
  await preview.getByRole("button", { name: "src/api/releases.ts:11" }).click();
  await expect(preview.locator(".diff-added")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await preview
    .getByRole("button", { name: "Reset example", exact: true })
    .click();
  await expect(
    preview.getByRole("tab", { name: "Risk", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(preview.locator(".diff-added")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await preview
    .getByRole("button", { name: "Open review checklist", exact: true })
    .click();
  for (const check of await checks.all()) await expect(check).not.toBeChecked();
  await expect(progress).toContainText("0 of 3");
  await preview
    .getByRole("button", { name: "Open response playground", exact: true })
    .click();
  await expect(
    preview.getByLabel("Example caller", { exact: true }),
  ).toHaveValue("array");
  await expect(
    preview.getByRole("button", { name: /^After change/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    preview.getByRole("status", { name: "Example caller result" }),
  ).toHaveAttribute("data-outcome", "idle");
});

for (const width of [1440, 390]) {
  test(`workspace tools, evidence links and checkboxes work with a keyboard at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const preview = page.locator("#report-preview");
    const tools = preview.getByRole("navigation", {
      name: "Example workspace tools",
    });
    await expect(tools).toBeVisible();
    await tools
      .getByRole("button", { name: "Open response playground", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      preview.getByRole("region", { name: "Try both sides of the contract." }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      preview.getByRole("button", { name: /^Before change/ }),
    ).toBeFocused();
    await page.keyboard.press("Space");
    await expect(
      preview.getByRole("button", { name: /^Before change/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await preview
      .getByRole("button", { name: "src/api/releases.ts:11" })
      .focus();
    await page.keyboard.press("Enter");
    const line = preview.getByRole("button", {
      name: "Select changed response line to inspect its risk",
    });
    await expect(line).toBeFocused();
    await expect(line).toBeInViewport();
    await expect(line).toHaveAttribute("aria-pressed", "true");
    await preview.getByRole("button", { name: "Inspect finding" }).click();
    await expect(preview.getByRole("tabpanel")).toBeFocused();
    await expect(preview.locator(".risk-view")).toHaveAttribute(
      "data-highlighted",
      "true",
    );
    await tools
      .getByRole("button", { name: "Open review checklist", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(preview.getByRole("tabpanel")).toBeFocused();
    await page.keyboard.press("Tab");
    const firstCheck = preview.getByRole("checkbox").first();
    await expect(firstCheck).toBeFocused();
    await page.keyboard.press("Space");
    await expect(firstCheck).toBeChecked();
    await expect(
      preview.getByRole("status", { name: "Example checklist progress" }),
    ).toContainText("1 of 3");
    const a11y = await new AxeBuilder({ page })
      .include("#report-preview")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(a11y.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await preview
      .getByRole("button", { name: "Open review checklist", exact: true })
      .click();
    await expect(firstCheck).not.toBeChecked();
  });
}

test("mobile menu closes on Escape and follows product and analyzer links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByLabel("Toggle navigation");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "Product", exact: true })
    .click();
  await expect(page).toHaveURL(/#report-preview$/);
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "Analyze a public PR" })
    .click();
  await expect(page).toHaveURL(/#analyze$/);
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeInViewport();
});

// CI may have only software GL. This fixture still exercises a real WebGL2
// renderer, but allows the software driver and simulates an eligible desktop.
// Production capability checks and browser-observation remain unmodified.
async function capableDesktop(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    const original = HTMLCanvasElement.prototype.getContext as (
      kind: string,
      options?: Record<string, unknown>,
    ) => RenderingContext | null;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: [string, Record<string, unknown>?]
    ) {
      if (String(args[0]).startsWith("webgl"))
        args[1] = { ...args[1], failIfMajorPerformanceCaveat: false };
      return original.apply(this, args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test("the desktop graph renders, moves, pauses and suspends offscreen", async ({
  page,
}) => {
  await capableDesktop(page);
  await page.addInitScript(() => {
    const metrics = window as typeof window & { graphLayoutShift: number };
    metrics.graphLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput) metrics.graphLayoutShift += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const graph = page.locator(".hero-stage");
  await expect(graph).toHaveAttribute("data-scene", "webgl", {
    timeout: 20_000,
  });
  const canvas = graph.locator("canvas");
  await expect(canvas).toHaveCount(1);
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(
      () => (window as typeof window & { graphLayoutShift: number }).graphLayoutShift,
    ),
  ).toBe(0);
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Load example PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  const first = await canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await canvas.screenshot()).equals(first)).toBe(false);
  await page.mouse.move(800, 300);
  await page.waitForTimeout(200);
  const left = await canvas.screenshot();
  await page.mouse.move(1300, 650);
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(left)).toBe(false);
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  await expect(graph).toHaveAttribute("data-motion-active", "false");
  await page.waitForTimeout(200);
  const paused = await canvas.screenshot();
  await page.waitForTimeout(350);
  expect((await canvas.screenshot()).equals(paused)).toBe(true);
  // A chapter can be explored while paused without starting autonomous motion.
  await graph.getByRole("button", { name: /Source/ }).click();
  await expect(graph).toHaveAttribute("data-phase", "source");
  await expect(graph).toHaveAttribute("data-motion-active", "false");
  await page.waitForTimeout(150);
  const sourceFocus = await canvas.screenshot();
  expect(sourceFocus.equals(paused)).toBe(false);
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(sourceFocus)).toBe(true);
  await page.setViewportSize({ width: 2560, height: 1440 });
  await expect
    .poll(async () => (await canvas.boundingBox())!.width)
    .toBeGreaterThan(1000);
  await expect(graph).toHaveAttribute("data-scene", "webgl");
  await expect(graph).toHaveAttribute("data-motion-active", "false");
  await page.waitForTimeout(200);
  const resized = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(resized)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await page.locator("#engineering-trust").scrollIntoViewIfNeeded();
  await expect(graph).toHaveAttribute("data-motion-active", "false");
  await graph.scrollIntoViewIfNeeded();
  await expect(graph).toHaveAttribute("data-motion-active", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveCount(0);
  await expect(graph).toHaveAttribute("data-scene", "static");
  await expect(graph.locator(".scene-fallback")).toBeVisible();
  expect(errors).toEqual([]);
});

test("release graph chapters work by keyboard with a static reduced-motion drawing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const graph = page.locator(".hero-stage");
  await expect(graph).toHaveAttribute("data-scene", "static");
  await expect(graph.locator("canvas")).toHaveCount(0);
  const source = graph.getByRole("button", { name: /Source/ });
  await source.focus();
  await page.keyboard.press("Space");
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await expect(graph).toHaveAttribute("data-phase", "source");
  await expect(graph.locator(".scene-review-note")).toContainText(
    "Inspect the changed shape",
  );
  await expect(graph.locator(".scene-phase-description")).toContainText(
    "specific set of changes",
  );
  await page.keyboard.press("Tab");
  await expect(graph.getByRole("button", { name: /Context/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(graph.getByRole("button", { name: /Findings/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(graph).toHaveAttribute("data-phase", "signal");
  await expect(graph.locator(".scene-review-note")).toContainText(
    "Human verification required",
  );
  await expect(graph.locator(".scene-fallback")).toBeVisible();
  await expect(graph.locator(".scene-phase-description")).toContainText(
    "evidence to inspect",
  );
  const sample = graph.getByRole("link", {
    name: /Explore an illustrative finding/,
  });
  await expect(sample).toHaveAttribute("href", "#report-preview");
  await sample.click();
  await expect(
    page.getByRole("heading", { name: /The change\. The evidence/ }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Load example PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeEnabled();
});

test("the editorial hero keeps its working input above a panoramic illustrative graph", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const title = await page.locator("#hero-title").boundingBox();
  const analyzer = await page.locator("#analyze").boundingBox();
  const graph = await page.locator(".hero-stage").boundingBox();
  expect(title!.y + title!.height).toBeLessThan(analyzer!.y);
  expect(analyzer!.y + analyzer!.height).toBeLessThan(graph!.y);
  expect(graph!.width).toBeGreaterThan(1200);
  expect(graph!.y + graph!.height).toBeLessThanOrEqual(900);
  await expect(page.locator(".scene-source-note")).toContainText(
    "{ items: Release[] }",
  );
  await expect(page.locator(".scene-review-note")).toContainText(
    "has not been inspected",
  );
  await expect(page.locator(".hero-stage")).toContainText("No live telemetry");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const phase of ["Source", "Context", "Findings"]) {
    await page
      .locator(".scene-chapters")
      .getByRole("button", { name: new RegExp(phase) })
      .click();
    const note = await page.locator(".scene-review-note").boundingBox();
    const link = await page.locator(".scene-signal-link").boundingBox();
    expect(note!.y + note!.height + 8).toBeLessThan(link!.y);
  }
});

async function expectWideGraphLayout(page: Page, viewportWidth: number) {
  const stage = page.locator(".hero-stage");
  const bounds = await stage.boundingBox();
  const workspace = await page.locator(".product-workspace").boundingBox();
  expect(bounds!.width / viewportWidth).toBeGreaterThanOrEqual(0.9);
  expect(workspace!.width / viewportWidth).toBeGreaterThanOrEqual(0.9);
  for (const phase of ["Source", "Context", "Findings"]) {
    await stage.getByRole("button", { name: new RegExp(phase) }).click();
    const source = await stage.locator(".scene-source-note").boundingBox();
    const visual = await stage.locator(".scene-visual").boundingBox();
    const note = await stage.locator(".scene-review-note").boundingBox();
    const link = await stage.locator(".scene-signal-link").boundingBox();
    const footer = await stage.locator(".scene-footer").boundingBox();
    expect(source!.x + source!.width + 8).toBeLessThanOrEqual(visual!.x);
    expect(visual!.x + visual!.width + 8).toBeLessThanOrEqual(note!.x);
    expect(note!.y + note!.height + 8).toBeLessThanOrEqual(link!.y);
    expect(link!.y + link!.height).toBeLessThanOrEqual(footer!.y + 1);
    await expect(stage.locator(".scene-caption")).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

for (const width of [2560, 3840]) {
  test(`the product fills a ${width}px wide display without overlapping graph controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: Math.round((width * 9) / 16) });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expectWideGraphLayout(page, width);
    await page.getByRole("button", { name: "Load example PR" }).click();
    await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Analyze PR", exact: true }),
    ).toBeInViewport();
  });
}

test.describe("75 percent desktop zoom layout", () => {
  // Desktop zoom increases CSS viewport dimensions and reduces DPR. This
  // emulates those metrics; it does not use mobile/pinch page-scale emulation.
  test.use({ deviceScaleFactor: 0.75, reducedMotion: "reduce" });
  for (const physicalWidth of [1920, 2560]) {
    test(`fills a ${physicalWidth}px physical viewport at zoom-equivalent metrics`, async ({
      page,
    }) => {
      const width = Math.round(physicalWidth / 0.75);
      await page.setViewportSize({
        width,
        height: Math.round((physicalWidth * 9) / 16 / 0.75),
      });
      await page.goto("/");
      expect(await page.evaluate(() => devicePixelRatio)).toBe(0.75);
      await expectWideGraphLayout(page, width);
      await page.getByRole("button", { name: "Load example PR" }).click();
      await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
    });
  }
});

test("enlarged scene text wraps without hiding explanations, links or chapter controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .locator(
      ".hero-stage p, .hero-stage h3, .hero-stage code, .hero-stage button, .hero-stage a, .scene-version",
    )
    .evaluateAll((elements) => {
      const sizes = elements.map((element) =>
        Math.max(18, parseFloat(getComputedStyle(element).fontSize) * 1.25),
      );
      elements.forEach((element, index) => {
        (element as HTMLElement).style.fontSize = `${sizes[index]}px`;
      });
    });
  await expectWideGraphLayout(page, 1440);
  await page
    .locator(".hero-stage")
    .getByRole("link", { name: /Explore an illustrative finding/ })
    .click();
  await expect(
    page.getByRole("heading", { name: /The change\. The evidence/ }),
  ).toBeInViewport();
});

test("GPU context loss retains the analyzer and the graph can recover", async ({
  page,
}) => {
  await capableDesktop(page);
  await page.goto("/");
  const graph = page.locator(".hero-stage");
  await expect(graph).toHaveAttribute("data-scene", "webgl", {
    timeout: 20_000,
  });
  const contextLost = await graph.locator("canvas").evaluate((node) => {
    const extension = (node as HTMLCanvasElement)
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    extension?.loseContext();
    return Boolean(extension);
  });
  expect(contextLost).toBe(true);
  await expect(graph).toHaveAttribute("data-scene", "fallback");
  await expect(graph.locator(".scene-fallback")).toBeVisible();
  await expect(graph.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Load example PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  await page.getByRole("button", { name: "Retry visualization" }).click();
  await expect(graph).toHaveAttribute("data-scene", "webgl", {
    timeout: 20_000,
  });
});

test("constrained desktops and forced colors preserve a static graph and working controls", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "deviceMemory", { get: () => 2 }),
  );
  await page.goto("/");
  await page.waitForTimeout(1100);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".scene-fallback")).toBeVisible();
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("button", { name: "Load example PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeEnabled();
});
