import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { neon } from "@neondatabase/serverless";

// Opt-in integration verification on a development instance only. Credentials,
// session tokens and verification codes never enter reports or browser traces.
const [
  envFile,
  base = "http://localhost:3105",
  output = "../accounts-artifacts",
] = process.argv.slice(2);
if (!envFile) throw new Error("Pass a private development environment file.");
const env = parseEnv(fs.readFileSync(envFile, "utf8"));
if (!env.CLERK_SECRET_KEY?.startsWith("sk_test_"))
  throw new Error("Development Clerk instance required.");
process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;
process.env.CLERK_PUBLISHABLE_KEY = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
await clerkSetup();
const email = `release-verification-${Date.now()}+clerk_test@example.com`;
const password = randomBytes(24).toString("base64url") + "aA1!";
const sql = neon(env.DATABASE_URL_UNPOOLED);
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});
let checks = 0;
let activePage;
let verificationResult;
const check = (actual, expected) => {
  assert.deepEqual(actual, expected);
  checks++;
};
const backend = (suffix, options = {}) =>
  fetch("https://api.clerk.com/v1/" + suffix, {
    ...options,
    headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
    signal: AbortSignal.timeout(15000),
  });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const previewOrigin = new URL(base).origin;
  if (
    process.env.VERCEL_OIDC_TOKEN &&
    /^release-engineer-[a-z0-9-]+-ozankenangungors-projects\.vercel\.app$/.test(
      new URL(base).hostname,
    )
  ) {
    // Scope the temporary Vercel credential to this project's preview origin;
    // global extra headers would also expose it to Clerk and other providers.
    await context.route(previewOrigin + "/**", (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN,
        },
      }),
    );
  }
  await context.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: { message: "Integration verification: no paid analysis." },
      },
    }),
  );
  const page = await context.newPage();
  activePage = page;
  await setupClerkTestingToken({ page });
  await page.goto(base + "/sign-up");
  await page
    .getByLabel("Email address", { exact: true })
    .waitFor({ timeout: 30000 });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForFunction(
    () => document.documentElement.scrollWidth <= innerWidth,
  );
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: path.join(output, "signup-dev-360.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Enter verification code").fill("424242");
  await page.waitForURL("**/account", {
    timeout: 30000,
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("heading", { name: "Your release workspace." })
    .waitFor();
  await page
    .locator(".account-counter strong")
    .filter({ hasText: "10" })
    .waitFor();
  await page
    .getByText("10 public PR reviews a day, up to 30 per UTC month, linked to your account.", {
      exact: true,
    })
    .waitFor();
  const state = await page.evaluate(async () => {
    const r = await fetch("/api/account");
    return {
      status: r.status,
      body: await r.json(),
      cache: r.headers.get("cache-control"),
    };
  });
  check(state.status, 200);
  check(state.body.usage.plan, "free");
  check(state.body.usage.limit, 10);
  check(state.body.usage.remaining, 10);
  check(state.body.usage.monthly.limit, 30);
  check(state.body.usage.monthly.remaining, 30);
  check(state.cache.includes("no-store"), true);
  if (!state.body.billing.ready) {
    const billingStatus = await page.evaluate(
      async () =>
        (await fetch("/api/billing/checkout", { method: "POST" })).status,
    );
    check(billingStatus, 503);
  }
  await page.screenshot({
    path: path.join(output, "account-dev-1440.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () => document.documentElement.scrollWidth <= innerWidth,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const layout = await page.evaluate(() => {
    const end =
      document.querySelector("footer").getBoundingClientRect().bottom + scrollY;
    return {
      height: document.documentElement.scrollHeight,
      footerEnd: end,
      extras: [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().bottom + scrollY > end + 10)
        .map((e) => ({
          tag: e.tagName,
          class: typeof e.className === "string" ? e.className : "SVG",
          position: getComputedStyle(e).position,
          height: Math.round(e.getBoundingClientRect().height),
        }))
        .slice(0, 12),
    };
  });
  fs.writeFileSync(
    path.join(output, "account-layout.json"),
    JSON.stringify(layout, null, 2),
  );
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: path.join(output, "account-dev-390.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Analyze a public PR" }).click();
  await page
    .locator("#free-allowance")
    .filter({ hasText: /10 of 10.*Your account/ })
    .waitFor();
  check(
    (await page.locator("#free-allowance").innerText())
      .toLowerCase()
      .includes("account"),
    true,
  );
  // A signed-in session survives reload; the account quota is not localStorage.
  await page.reload();
  await page
    .locator("#free-allowance")
    .filter({ hasText: /account/i })
    .waitFor();
  await page.goto(base + "/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(base + "/", {
    timeout: 30000,
    waitUntil: "domcontentloaded",
  });
  check(
    await page.evaluate(async () => (await fetch("/api/account")).status),
    401,
  );
  await page.goto(base + "/sign-in");
  await page.getByLabel("Email address", { exact: true }).waitFor();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL("**/account", {
    timeout: 30000,
    waitUntil: "domcontentloaded",
  });
  check(
    await page.evaluate(async () => (await fetch("/api/account")).status),
    200,
  );
  verificationResult = {
    result: "passed",
    checks,
    registeredThroughUI: true,
    signedInAgain: true,
    paidClaudeCalls: 0,
    realPayments: 0,
  };
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    await activePage.screenshot({
      path: path.join(output, "auth-failure.png"),
      fullPage: true,
    });
    console.error(
      "Verification stopped at " + new URL(activePage.url()).pathname,
    );
  }
  throw error;
} finally {
  await browser.close();
  // Only the uniquely named test account from this invocation is removed.
  const response = await backend(
    "users?email_address=" + encodeURIComponent(email),
  );
  if (!response.ok)
    throw new Error("Could not locate verification account for cleanup.");
  // Raw BAPI returns an array; the Clerk SDK wraps it in { data }.
  const users = await response.json();
  if (!Array.isArray(users))
    throw new Error("Unexpected verification-account lookup response.");
  const matches = users.filter((user) =>
    user.email_addresses.some((address) => address.email_address === email),
  );
  if (verificationResult && matches.length !== 1)
    throw new Error("Could not uniquely identify the owned verification account.");
  for (const user of matches) {
    await sql`DELETE FROM release_engineer.accounts WHERE user_id = ${user.id}`;
    const deleted = await backend("users/" + user.id, { method: "DELETE" });
    if (!deleted.ok) throw new Error("Verification account cleanup failed.");
    check((await backend("users/" + user.id)).status, 404);
    check(
      (await sql`SELECT user_id FROM release_engineer.accounts WHERE user_id = ${user.id}`)
        .length,
      0,
    );
  }
}

// A successful report includes cleanup; do not announce success before it.
console.log(
  JSON.stringify({ ...verificationResult, checks, ownedTestAccountDeleted: true }),
);
