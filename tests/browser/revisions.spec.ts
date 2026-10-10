import { test, expect } from "./test";
import AxeBuilder from "@axe-core/playwright";
import { reviewSnapshot } from "@/lib/review-comparison";
import { handoffResponse } from "../verification-fixtures";
test.beforeEach(async({context})=>{await context.route("**/api/analyze",route=>route.fulfill({json:handoffResponse()}));});
for(const width of [1440,390,360]) test(`local illustrative comparison is accessible at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto("/compare");
  await page.getByRole("button",{name:"Load illustrative comparison"}).click();
  await expect(page.getByText("Not reported again · Verify",{exact:true})).toBeVisible();
  await expect(page.getByText("Illustrative example — not a live analysis or Daniel’s report.")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole("button",{name:"Clear comparison"}).click();await expect(page.getByText("Two reviews. A clearer next step.")).toBeVisible();
});
test("a real exported report can be compared locally after a revision without network upload",async({page})=>{
  await page.goto("/");await page.getByRole("button",{name:"Load example PR"}).click();await page.getByRole("button",{name:"Analyze PR",exact:true}).click();
  const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Download Review JSON"}).click();
  const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/-review\.json$/);
  const path=await download.path();expect(path).toBeTruthy();
  await page.getByRole("link",{name:"Compare PR revisions"}).click();await expect(page).toHaveURL(/\/compare$/);
  await page.locator("#revision-0").setInputFiles(path!);
  const later=handoffResponse();later.pullRequest.headSha="b".repeat(40);later.review.findings=[];
  await page.locator("#revision-1").setInputFiles({name:"later.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(reviewSnapshot(later)))});
  await expect(page.getByText("Not reported again · Verify",{exact:true})).toBeVisible();
  await expect(page.getByText("One or both records have partial context.",{exact:false})).toBeVisible();
});
test("invalid input can be corrected and a different PR cannot be compared",async({page})=>{
  await page.goto("/compare");await page.locator("#revision-0").setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from("<script>alert(1)</script>")});
  await expect(page.getByRole("alert",{name:"Comparison error"})).toContainText("not valid JSON");
  const first=handoffResponse();const second=handoffResponse();second.pullRequest.number=2;second.pullRequest.url=second.pullRequest.url.replace(/1$/,"2");
  for(const [index,result] of [first,second].entries()) await page.locator(`#revision-${index}`).setInputFiles({name:"review.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(reviewSnapshot(result)))});
  await expect(page.getByRole("alert",{name:"Comparison error"})).toContainText("same public GitHub PR");
  await page.getByRole("button",{name:"Load illustrative comparison"}).click();await expect(page.getByRole("alert",{name:"Comparison error"})).toHaveCount(0);
});
test("Daniel outcome states concrete developer actions and links to the local workflow",async({page})=>{
  await page.goto("/case-studies/webhook-review");await expect(page.getByRole("heading",{level:1})).toContainText("stronger validation");
  await expect(page.locator("main")).toContainText("validate=True");await expect(page.locator("main")).toContainText("developer ran those tests");
  await expect(page.locator("main")).toContainText("developer-reported outcome");await page.getByRole("main").getByRole("link",{name:"Compare reviews",exact:false}).click();await expect(page).toHaveURL(/\/compare$/);
});
