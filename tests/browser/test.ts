import { test as base, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

// Optional real-instance runs use Clerk-issued testing tokens to bypass bot
// detection in automation. CI needs no provider credentials. This never signs
// in a user, changes a plan, or bypasses application resource authorization.
export const test = base.extend<{ clerkAutomation: void }>({
  clerkAutomation: [
    async ({ context }, use) => {
      if (process.env.CLERK_TESTING_TOKEN)
        await setupClerkTestingToken({ context });
      await use();
    },
    { auto: true },
  ],
});
export { expect };
