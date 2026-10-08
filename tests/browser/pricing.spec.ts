import { test, expect } from "./test";
import AxeBuilder from "@axe-core/playwright";
import { handoffResponse } from "../verification-fixtures";
import { FREE_USAGE_KEY } from "../../src/lib/free-plan";

// Every API request is intercepted, including against production. No paid calls.
test.beforeEach(async ({ context }) => {
  await context.route("**/api/analyze", route => route.fulfill({ status: 503, json: { error: { message: "Offline service error." } } }));
});

for (const width of [1440, 1024, 390, 360]) {
  test(`pricing plans and navigation are usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    if (width < 1024) {
      await page.getByLabel("Toggle navigation").click();
      await page.getByRole("navigation", { name: "Mobile", exact: true }).getByRole("link", { name: "Pricing", exact: true }).focus();
    } else {
      const navigation = await page.getByRole("navigation", { name: "Main", exact: true }).boundingBox();
      const action = await page.locator(".header-action").boundingBox();
      expect(navigation!.x + navigation!.width).toBeLessThan(action!.x);
      await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Pricing", exact: true }).focus();
    }
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.locator("h1")).toContainText("Build release confidence.");
    const free = page.getByRole("article", { name: "Free", exact: true });
    const pro = page.getByRole("article", { name: "Pro", exact: true });
    await expect(page.getByRole("region", { name: "Review plans" }).getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("article", { name: "Team", exact: true })).toHaveCount(0);
    await expect(free).toContainText("10 reviews / day");
    await expect(free).toContainText("Available now");
    await expect(pro).toContainText("Sandbox preview");
    await expect(pro).toContainText("100 reviews / day");
    await expect(free.locator(".pricing-price")).toHaveText("$0");
    await expect(pro.locator(".pricing-price")).toHaveText("$9");
    await expect(pro.getByRole("link", { name: "Request Pro access" })).toHaveAttribute("href", /^mailto:founder@releaseengineer\.tech\?subject=/);
    await expect(pro.getByRole("button", { name: "Preview checkout", exact: true })).toBeVisible();
    await expect(pro).toContainText("Use test cards in this checkout preview.");
    await expect(pro).toContainText("Sandbox checkout · $9/month");
    await expect(page.locator(".pricing-table-scroll thead th")).toHaveCount(3);
    await expect(page.locator(".pricing-page")).not.toContainText(/Team|\$19|\$79|Planned|30 reviews/);
    await expect(page.getByRole("button", { name: /buy|subscribe/i })).toHaveCount(0);
    const question = page.getByText("How do the 10 free reviews work?", { exact: false });
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("It is a browser allowance", { exact: false })).toBeVisible();
    const proQuestion = page.getByText("How does Pro access work?", { exact: false });
    await proQuestion.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Sandbox completion does not activate the production allowance.", { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await free.getByRole("link", { name: "Analyze a PR" }).click();
    await expect(page).toHaveURL(/\/#analyze$/);
    await expect(page.getByLabel("GitHub pull request URL")).toBeVisible();
  });
}

test("the tenth successful review counts, persists after reload and blocks an eleventh submission", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/analyze", async route => { calls++; await route.fulfill({ json: handoffResponse() }); });
  await page.goto("/");
  await page.evaluate(key => { localStorage.setItem(key, JSON.stringify({ day: new Date().toISOString().slice(0, 10), used: 9 })); }, FREE_USAGE_KEY);
  await page.reload();
  await expect(page.locator("#free-allowance")).toContainText("1 of 10");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("region", { name: "Completed release review" })).toBeVisible();
  await expect(page.locator("#free-allowance")).toContainText("Daily limit reached");
  await expect(page.getByRole("button", { name: "Analyze PR", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Analyze PR", exact: true })).toBeDisabled();
  await page.getByLabel("GitHub pull request URL").fill("https://github.com/octocat/hello-world/pull/1");
  await page.locator("#analyze form").evaluate(form => (form as HTMLFormElement).requestSubmit());
  await expect(page.getByRole("alert", { name: "Analysis error" })).toContainText("today's 10");
  expect(calls).toBe(1);
});

test("errors and malformed reports do not count; a validated report with no findings does", async ({ page }) => {
  await page.goto("/");
  const submit = page.getByRole("button", { name: "Analyze PR", exact: true });
  await page.getByRole("button", { name: "Load example PR" }).click();
  await submit.click();
  await expect(page.getByRole("alert", { name: "Analysis error" })).toContainText("Offline service error");
  await expect(page.locator("#free-allowance")).toContainText("10 of 10");
  await page.route("**/api/analyze", route => route.fulfill({ json: { review: "invalid" } }));
  await submit.click();
  await expect(page.getByRole("alert", { name: "Analysis error" })).toContainText("could not be validated");
  await expect(page.locator("#free-allowance")).toContainText("10 of 10");
  const response = handoffResponse();
  response.review.findings = [];
  await page.route("**/api/analyze", route => route.fulfill({ json: response }));
  await submit.click();
  await expect(page.getByRole("region", { name: "Completed release review" })).toBeVisible();
  await expect(page.locator("#free-allowance")).toContainText("9 of 10");
});

test("an open page refreshes its allowance at UTC midnight", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-11T23:59:30Z") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ day: "2026-10-11", used: 10 })), FREE_USAGE_KEY);
  await page.reload();
  await expect(page.getByRole("button", { name: "Analyze PR", exact: true })).toBeDisabled();
  await page.clock.fastForward(60_000);
  await expect(page.locator("#free-allowance")).toContainText("10 of 10");
  await expect(page.getByRole("button", { name: "Analyze PR", exact: true })).toBeEnabled();
});

test("unavailable browser storage gives actionable guidance without starting a review", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Unavailable", "SecurityError"); } }); });
  let calls = 0;
  page.on("request", request => { if (request.url().endsWith("/api/analyze")) calls++; });
  await page.goto("/");
  await expect(page.locator("#free-allowance")).toContainText("Enable browser storage");
  await expect(page.getByRole("button", { name: "Analyze PR", exact: true })).toBeDisabled();
  expect(calls).toBe(0);
});

test("tabs share the allowance and cannot spend the last review concurrently", async ({ page, context }) => {
  let calls = 0;
  let finish!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await context.route("**/api/analyze", async route => { calls++; await pending; await route.fulfill({ json: handoffResponse() }); });
  await page.goto("/");
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ day: new Date().toISOString().slice(0, 10), used: 9 })), FREE_USAGE_KEY);
  await page.reload();
  const other = await context.newPage();
  await other.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await other.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await other.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(other.getByRole("alert", { name: "Analysis error" })).toContainText("Another review is running");
  finish();
  await expect(page.locator("#free-allowance")).toContainText("Daily limit reached");
  await expect(other.locator("#free-allowance")).toContainText("Daily limit reached");
  expect(calls).toBe(1);
});

test("browsers without Web Locks can complete a free review", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined }));
  await page.route("**/api/analyze", route => route.fulfill({ json: handoffResponse() }));
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("region", { name: "Completed release review" })).toBeVisible();
  await expect(page.locator("#free-allowance")).toContainText("9 of 10");
});

test("storage becoming unwritable preserves the completed report and prevents another API call", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/analyze", async route => {
    calls++;
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); }; });
    await route.fulfill({ json: handoffResponse() });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("region", { name: "Completed release review" })).toBeVisible();
  await expect(page.getByRole("alert", { name: "Analysis error" })).toContainText("Review ready");
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Analysis error" })).toContainText("Enable browser storage");
  expect(calls).toBe(1);
});
