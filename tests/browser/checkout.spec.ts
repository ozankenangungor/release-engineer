import { expect, test } from "./test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CHECKOUT_TIMEOUT_MS, PADDLE_SCRIPT_URL, PADDLE_SANDBOX } from "../../src/lib/paddle-sandbox";
import { FREE_USAGE_KEY } from "../../src/lib/free-plan";

// Offline behavioral fixture, not evidence of a live Paddle transaction.
const fixture = (ready = true) => `(() => {
  let callback;
  const calls = { environments: [], initialized: 0, updated: 0, opened: [], closed: 0 };
  const record = () => { document.documentElement.dataset.paddleTest = JSON.stringify(calls); };
  const paddle = {
    Initialized: false,
    Environment: { set(environment) { calls.environments.push(environment); record(); } },
    Initialize(options) { this.Initialized = true; calls.initialized++; calls.token = options.token; calls.settings = options.checkout.settings; callback = options.eventCallback; record(); },
    Update(options) { calls.updated++; callback = options.eventCallback; record(); },
    Checkout: {
      open(options) { calls.opened.push(options); record(); ${ready ? 'queueMicrotask(() => callback({ name: "checkout.loaded" }));' : ''} },
      close() { calls.closed++; record(); callback?.({ name: "checkout.closed" }); }
    }
  };
  window.PaddleBillingV1 = paddle;
  window.Paddle = paddle;
  window.addEventListener("paddle-test-event", event => callback?.(event.detail));
  record();
})();`;

async function calls(page: Page) {
  return page.evaluate(() => JSON.parse(document.documentElement.dataset.paddleTest ?? "{}"));
}

test.beforeEach(async ({ context }) => {
  await context.route("**/api/analyze", route => route.abort());
  // Catch every provider request. CI cannot reach Paddle or make a purchase.
  await context.route(/https:\/\/([^/]+\.)?paddle\.com\//, route => route.abort());
  await context.route(PADDLE_SCRIPT_URL, route => route.fulfill({ contentType: "application/javascript", body: fixture() }));
});

test("checkout stays unloaded until keyboard activation and always uses sandbox", async ({ page }) => {
  let scriptRequests = 0;
  page.on("request", request => { if (request.url() === PADDLE_SCRIPT_URL) scriptRequests++; });
  await page.goto("/pricing");
  const preview = page.getByRole("button", { name: "Preview checkout", exact: true });
  await expect(preview).toBeVisible();
  expect(scriptRequests).toBe(0);
  await preview.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Checkout is open" })).toHaveAttribute("aria-disabled", "true");
  const captured = await calls(page);
  expect(scriptRequests).toBe(1);
  expect(captured.environments).toEqual(["sandbox"]);
  expect(captured.token).toBe(PADDLE_SANDBOX.token);
  expect(captured.token).toMatch(/^test_/);
  expect(captured.settings).toMatchObject({ theme: "dark", displayMode: "overlay", allowedPaymentMethods: ["card"] });
  expect(captured.opened).toEqual([{ items: [{ priceId: PADDLE_SANDBOX.priceId, quantity: 1 }] }]);
  await page.keyboard.press("Enter");
  expect((await calls(page)).opened).toHaveLength(1);
  await page.evaluate(() => window.PaddleBillingV1?.Checkout.close());
  await expect(preview).toBeFocused();
  await preview.click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  expect((await calls(page)).initialized).toBe(1);
});

test("completion is a demo confirmation and grants no allowance or paid access", async ({ page }) => {
  await page.goto("/pricing");
  const before = await page.evaluate(key => localStorage.getItem(key), FREE_USAGE_KEY);
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("paddle-test-event", { detail: { name: "checkout.completed" } })));
  await expect(page.locator(".checkout-status")).toContainText("No payment was taken and no paid plan was activated.");
  await expect(page.getByRole("button", { name: "Preview checkout", exact: true })).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), FREE_USAGE_KEY)).toBe(before);
  await expect(page.getByRole("article", { name: "Pro", exact: true })).toContainText("Sandbox preview");
  await page.reload();
  await expect(page.locator(".checkout-status")).toBeEmpty();
});

test("a blocked CDN load shows an accessible error and retry works without reload", async ({ page }) => {
  let attempts = 0;
  await page.route(PADDLE_SCRIPT_URL, route => {
    attempts++;
    return attempts === 1 ? route.abort() : route.fulfill({ contentType: "application/javascript", body: fixture() });
  });
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Checkout error" })).toContainText("Checkout preview is temporarily unavailable");
  await expect(page.getByRole("button", { name: "Retry checkout preview" })).toBeFocused();
  await page.getByRole("button", { name: "Retry checkout preview" }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  expect(attempts).toBe(2);
  await expect(page.getByRole("alert", { name: "Checkout error" })).toHaveCount(0);
});

test("an iframe that never becomes ready times out and can be retried", async ({ page }) => {
  await page.clock.install();
  await page.route(PADDLE_SCRIPT_URL, route => route.fulfill({ contentType: "application/javascript", body: fixture(false) }));
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect.poll(async () => (await calls(page)).opened?.length).toBe(1);
  await page.clock.fastForward(CHECKOUT_TIMEOUT_MS + 1);
  await expect(page.getByRole("alert", { name: "Checkout error" })).toContainText("Checkout preview is temporarily unavailable");
  await page.getByRole("button", { name: "Retry checkout preview" }).click();
  await expect.poll(async () => (await calls(page)).opened?.length).toBe(2);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("paddle-test-event", { detail: { name: "checkout.loaded" } })));
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
});

test("provider errors recover and navigation cleans up an open checkout", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("paddle-test-event", { detail: { name: "checkout.error", detail: "Private provider payload must not be displayed." } })));
  await expect(page.getByRole("alert", { name: "Checkout error" })).toContainText("Free PR analysis is still available");
  await expect(page.locator("body")).not.toContainText("Private provider payload");
  await page.getByRole("button", { name: "Retry checkout preview" }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  await page.getByRole("article", { name: "Free", exact: true }).getByRole("link", { name: "Analyze a PR" }).click();
  await expect(page.getByLabel("GitHub pull request URL")).toBeVisible();
  await expect.poll(async () => (await calls(page)).closed).toBe(2);
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Pricing", exact: true }).click();
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
  expect((await calls(page)).initialized).toBe(1);
});

test("mobile preview and test instructions remain accessible with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pricing");
  await page.getByText("Test card details", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("4242 4242 4242 4242", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Checkout is open" })).toBeVisible();
});

for (const providerError of [
  { name: "checkout.error", code: "transaction_default_checkout_url_not_set" },
  // Actual sandbox startup response observed on the deployed site.
  { name: "checkout.error", type: "api_error", code: "validation", errors: [{ message: "transaction_default_checkout_url_not_set" }] },
]) test(`missing provider configuration (${providerError.code}) recovers before checkout loads`, async ({ page }) => {
  await page.route(PADDLE_SCRIPT_URL, route => route.fulfill({ contentType: "application/javascript", body: fixture(false) }));
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Preview checkout", exact: true }).click();
  await expect.poll(async () => (await calls(page)).opened?.length).toBe(1);
  await page.evaluate(detail => window.dispatchEvent(new CustomEvent("paddle-test-event", { detail })), providerError);
  await expect(page.getByRole("alert", { name: "Checkout error" })).toContainText("Checkout preview is being configured");
  await expect(page.getByRole("link", { name: "Request Pro access" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry checkout preview" })).toBeFocused();
  await expect(page.locator("body")).not.toContainText("transaction_default_checkout_url_not_set");
});

test("the pricing offers remain readable when JavaScript is disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/pricing`);
    await expect(page.getByRole("article", { name: "Free", exact: true })).toContainText("10 reviews / month");
    // Playwright's text selector excludes noscript nodes. With scripting
    // disabled, target the rendered fallback directly and verify visibility.
    const fallback = page.locator("noscript .checkout-preview-note");
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText("JavaScript is required to open the test checkout.");
    await expect(page.getByRole("link", { name: "Request Pro access" })).toHaveAttribute("href", /^mailto:/);
  } finally {
    await context.close();
  }
});
