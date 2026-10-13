import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testDir: "./tests/manual",
  projects: [{ name: "h6-manual", testMatch: "h6-review.spec.ts" }],
  workers: 1,
  timeout: 30 * 60 * 1000,
  expect: { timeout: 20_000 },
  reporter: "line",
  use: { ...baseConfig.use, headless: false, trace: "off", screenshot: "off", video: "off", viewport: null, actionTimeout: 30_000, navigationTimeout: 30_000 },
  webServer: {
    ...baseConfig.webServer,
    env: { APP_SITE_URL: "http://127.0.0.1:3100", APP_BUILD_PROFILE: "manual-h6" },
    command: "yarn build:local && yarn start:local --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
