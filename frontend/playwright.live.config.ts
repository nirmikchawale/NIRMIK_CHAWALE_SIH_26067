import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Software-rendered Cesium scenes compete for the small CI runner GPU/CPU budget.
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 20_000
  },
  retries: 1,
  reporter: [["list"]],
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: [
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--use-angle=swiftshader"
      ]
    }
  }
});
