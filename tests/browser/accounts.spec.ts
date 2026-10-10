import { test, expect } from "./test";
import { FREE_USAGE_KEY } from "../../src/lib/free-plan";
import { handoffResponse } from "../verification-fixtures";

// Client presentation tests use explicit responses. Auth and durable quotas are
// separately verified against real Clerk/Neon by the opt-in integration scripts.
const state = (plan: "free" | "pro", used = 0) => ({
  usage: {
    plan,
    limit: plan === "pro" ? 100 : 10,
    used,
    pending: 0,
    remaining: (plan === "pro" ? 100 : 10) - used,
    resetsAt: "2026-10-12T00:00:00Z",
  },
  subscription: null,
  billing: { environment: "sandbox", ready: false },
});
test.beforeEach(async ({ context }) => {
  await context.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: "Offline verification." } },
    }),
  );
});

test("a Pro account uses its server allowance even when the browser counter is exhausted", async ({
  page,
}) => {
  let used = 0;
  await page.route("**/api/account", (route) =>
    route.fulfill({ json: state("pro", used) }),
  );
  await page.route("**/api/analyze", (route) => {
    used++;
    return route.fulfill({ json: handoffResponse() });
  });
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          day: new Date().toISOString().slice(0, 10),
          used: 10,
        }),
      ),
    FREE_USAGE_KEY,
  );
  await page.goto("/");
  await expect(page.locator("#free-allowance")).toContainText("100 of 100 Pro");
  await expect(page.locator("#free-allowance")).toContainText("Your account");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Completed release review" }),
  ).toBeVisible();
  await expect(page.locator("#free-allowance")).toContainText("99 of 100 Pro");
  expect(
    JSON.parse(
      (await page.evaluate(
        (key) => localStorage.getItem(key),
        FREE_USAGE_KEY,
      ))!,
    ).used,
  ).toBe(10);
  await page.reload();
  await expect(page.locator("#free-allowance")).toContainText("99 of 100 Pro");
});

test("signed-in Free daily exhaustion blocks submission in a fresh browser", async ({
  page,
}) => {
  await page.route("**/api/account", (route) =>
    route.fulfill({ json: state("free", 10) }),
  );
  await page.goto("/");
  await expect(page.locator("#free-allowance")).toContainText(
    "Daily limit reached",
  );
  await expect(page.locator("#free-allowance")).toContainText("Your account");
  await expect(
    page.getByRole("button", { name: "Analyze PR", exact: true }),
  ).toBeDisabled();
});

test("malformed account responses do not present an unvalidated Pro allowance", async ({
  page,
}) => {
  await page.route("**/api/account", (route) =>
    route.fulfill({ json: { usage: { plan: "pro", limit: 100 } } }),
  );
  await page.goto("/");
  await expect(page.locator("#free-allowance")).toContainText("10 of 10 free");
  await expect(page.locator("#free-allowance")).toContainText("This browser");
});

test("pricing leads guests to registration and signed-in accounts to their workspace", async ({
  page,
}) => {
  await page.route("**/api/account", (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.goto("/pricing");
  await expect(
    page.getByRole("link", { name: "Create an account" }).first(),
  ).toHaveAttribute("href", "/sign-up");
  await page.route("**/api/account", (route) =>
    route.fulfill({ json: state("free") }),
  );
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Manage Pro in your account" }),
  ).toHaveAttribute("href", "/account");
});

for (const width of [360, 1024]) {
  test(`sign-in navigation is keyboard operable at ${width}px and registration has no horizontal overflow`, async ({
    page,
  }) => {
    await page.route("**/api/account", (route) =>
      route.fulfill({ status: 401, json: {} }),
    );
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByLabel("Toggle navigation").click();
    await page
      .getByRole("navigation", { name: "Mobile", exact: true })
      .getByRole("link", { name: "Sign in" })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "your next review.",
    );
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your review workspace.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
