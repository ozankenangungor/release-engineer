import { defineConfig } from "@playwright/test";

const externalBase = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: externalBase ?? "http://localhost:3101",
    browserName: "chromium",
    launchOptions: {
      args: ["--enable-unsafe-swiftshader"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
    },
    trace: "retain-on-failure",
  },
  webServer: externalBase
    ? undefined
    : {
        command: "pnpm start --port 3101",
        url: "http://localhost:3101",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
