import { describe, expect, it } from "vitest";

import { inspectRuntimeHealth } from "./health";

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_health",
  APP_SITE_URL: "https://example.test", SUPABASE_SECRET_KEY: "sb_secret_synthetic_health", STAFF_AUTH_FLOW_SECRET: "synthetic-health-secret-long-enough",
  APP_RELEASE_ID: "a".repeat(40),
};
describe("Salud pública mínima", () => {
  it("comprueba configuración y versión sin depender de la base", () => {
    expect(inspectRuntimeHealth(environment)).toEqual({ status: 200, body: { status: "ok", release: "a".repeat(40) } });
  });
  it("configuración incompleta devuelve 503 sin publicar variables o sus valores", () => {
    const result = inspectRuntimeHealth({ ...environment, SUPABASE_SECRET_KEY: "" });
    expect(result.status).toBe(503); expect(result.body.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toMatch(/SUPABASE|example|synthetic/);
  });
  it("nunca devuelve una versión arbitraria que pueda contener datos privados", () => {
    expect(inspectRuntimeHealth({ ...environment, APP_RELEASE_ID: "correo@example.test" }).body.release).toBe("unversioned");
  });
});
