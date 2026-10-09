import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { handoffResponse } from "../verification-fixtures";
import { verificationRecordSchema } from "../../src/lib/verification-record";

// Intercept before navigation, including against production. No paid model call.
test.beforeEach(async ({ context }) => {
  await context.route("**/api/analyze", (route) => route.fulfill({
    status: 503, json: { error: { code: "TEST_STUB", message: "Offline browser test stub." } },
  }));
});

async function analyzeStub(page: Page) {
  await page.route("**/api/analyze", (route) => route.fulfill({ json: handoffResponse() }));
  await page.goto("/");
  await page.getByLabel("GitHub pull request URL").fill("https://github.com/octocat/hello-world/pull/1");
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download report" })).toBeVisible();
}
async function capture(page: Page, name: string) {
  if (!process.env.AUDIT_SCREENSHOT_DIR) return;
  mkdirSync(process.env.AUDIT_SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: join(process.env.AUDIT_SCREENSHOT_DIR, name), fullPage: true });
  if (name.startsWith("verified-report"))
    await page.locator("#review-handoff").screenshot({ path: join(process.env.AUDIT_SCREENSHOT_DIR, `handoff-${name}`) });
}

for (const width of [1440, 360]) {
  test(`downloads pinned reports and local human verification at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [], postRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (request.method() === "POST") postRequests.push(request.url()); });
    await analyzeStub(page);
    const reportDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download report" }).click();
    const report = await reportDownload;
    expect(report.suggestedFilename()).toBe("octocat-hello-world-pr-1-aaaaaaaa-review.txt");
    const text = await readFile((await report.path())!, "utf8");
    expect(text).toContain("Reviewed head: " + "a".repeat(40));
    expect(text).toContain("Context: Partial");
    expect(text).toContain("API does not provide its execution revision or served model");
    expect(text).toContain("Tests were not run by Release Engineer");

    await page.getByText("Record your human verification", { exact: false }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Finding 1 assessment")).toHaveValue("not_checked");
    await expect(page.getByLabel("Was this review useful?")).toHaveValue("not_assessed");
    await page.getByRole("button", { name: "Download verification record" }).click();
    await expect(page.getByRole("alert", { name: "Export error" })).toContainText("Record an assessment");
    await page.getByLabel("Finding 1 assessment").selectOption("supported");
    await page.getByRole("button", { name: "Download verification record" }).click();
    await expect(page.getByLabel("Evidence checked for finding 1")).toBeFocused();
    await page.getByLabel("Evidence checked for finding 1").fill("Offline browser test: checked the authored fixture, not a real PR.");
    await page.getByLabel("Was this review useful?").selectOption("mixed");
    await page.getByLabel("What did you do?").selectOption("checked_evidence");
    await page.getByLabel("What was useful, wrong or missing?").fill("Offline browser fixture; useful but missing caller context. Not external feedback.");
    const verificationDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download verification record" }).click();
    const verification = await verificationDownload;
    expect(verification.suggestedFilename()).toBe("octocat-hello-world-pr-1-aaaaaaaa-verification.json");
    const record = verificationRecordSchema.parse(JSON.parse(await readFile((await verification.path())!, "utf8")));
    expect(record.findings[0]?.assessment).toBe("supported");
    expect(record.reviewReference.reviewedHeadSha).toBe("a".repeat(40));
    expect(record.reviewReference.responseReceivedAt).not.toBeNull();
    expect(record.feedback.priorUse).toBe("not_recorded");
    expect(record.qualification).toContain("not independently verified");
    expect(Object.keys(record)).not.toContain("email");
    await expect(page.locator(".handoff-status")).toContainText("Nothing was submitted");
    expect(postRequests).toHaveLength(1);
    expect(postRequests[0]).toMatch(/\/api\/analyze$/);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await capture(page, `verified-report-${width}.png`);

    await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
    await page.getByText("Record your human verification", { exact: false }).click();
    await expect(page.getByLabel("Finding 1 assessment")).toHaveValue("not_checked");
    await expect(page.getByLabel("Evidence checked for finding 1")).toHaveValue("");
    await expect(page.getByLabel("Was this review useful?")).toHaveValue("not_assessed");
    await expect(page.locator(".handoff-status")).toBeEmpty();
  });
}

test("a no-findings report can record a missed concern without inventing finding evidence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = handoffResponse();
  response.review.findings = [];
  await page.route("**/api/analyze", (route) => route.fulfill({ json: response }));
  await page.goto("/");
  await page.getByRole("button", { name: "Load example PR" }).click();
  await page.getByRole("button", { name: "Analyze PR", exact: true }).click();
  await page.getByText("Record your human verification", { exact: false }).click();
  await expect(page.locator(".verification-empty")).toContainText("does not establish release safety");
  await page.getByLabel("Was this review useful?").selectOption("not_useful");
  await page.getByLabel("What was useful, wrong or missing?").fill("An authored test fixture missed a concern; not a real observation.");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download verification record" }).click();
  const download = await pending;
  const record = verificationRecordSchema.parse(JSON.parse(await readFile((await download.path())!, "utf8")));
  expect(record.findings).toEqual([]);
  expect(record.feedback.usefulness).toBe("not_useful");
});

test("the beta guide and blank worksheet work without scripts or a model request", async ({ page, context, request }) => {
  let calls = 0;
  page.on("request", (req) => { if (req.url().endsWith("/api/analyze")) calls++; });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/pilot", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Review one change");
  await expect(page.getByRole("link", { name: "Analyze your public PR" })).toHaveAttribute("href", "/#analyze");
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download a blank feedback worksheet" }).click();
  const worksheet = await pending;
  const text = await readFile((await worksheet.path())!, "utf8");
  expect(text).toContain("BLANK BETA FEEDBACK WORKSHEET");
  expect(text).toContain("not granted unless separately agreed");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("https://releaseengineer.tech/pilot");
  expect(calls).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await capture(page, "pilot-360.png");
  const noScripts = await context.browser()!.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
  try {
    const plain = await noScripts.newPage();
    await plain.goto("/pilot");
    await expect(plain.getByRole("heading", { name: "Choose a change you can verify." })).toBeVisible();
    await expect(plain.getByRole("link", { name: "Download a blank feedback worksheet" })).toBeVisible();
  } finally { await noScripts.close(); }
});
