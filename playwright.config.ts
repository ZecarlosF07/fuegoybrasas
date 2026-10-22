import { defineConfig } from "@playwright/test";

import { E2E_ORIGIN, E2E_PORT } from "./tests/e2e/environment";

process.loadEnvFile(".env.local");
process.env.E2E_EVIDENCE_ROOT ??= "docs/implementacion/evidencia/h8/capturas";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl || !["127.0.0.1", "localhost"].includes(new URL(supabaseUrl).hostname)) {
  throw new Error("E2E exige Supabase local; nunca ejecutar fixtures contra el proyecto remoto.");
}
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  projects: [
    { name: "core", testIgnore: ["**/catalog-failure.spec.ts", "**/catalog-admin.spec.ts", "**/checkout.spec.ts", "**/loyalty.spec.ts", "**/management.spec.ts"] },
    { name: "catalog-admin", testMatch: "**/catalog-admin.spec.ts", dependencies: ["core"], fullyParallel: false, workers: 1 },
    { name: "checkout", testMatch: "**/checkout.spec.ts", dependencies: ["catalog-admin"], fullyParallel: false, workers: 1 },
    { name: "loyalty", testMatch: "**/loyalty.spec.ts", dependencies: ["checkout"], fullyParallel: false, workers: 1 },
    { name: "management", testMatch: "**/management.spec.ts", dependencies: ["loyalty"], fullyParallel: false, workers: 1 },
    { name: "catalog-failure", testMatch: "**/catalog-failure.spec.ts", dependencies: ["management"], fullyParallel: false, workers: 1 },
  ],
  use: {
    baseURL: E2E_ORIGIN,
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    env: { APP_SITE_URL: E2E_ORIGIN },
    command: `yarn start:local --port ${E2E_PORT} --hostname 127.0.0.1`,
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
