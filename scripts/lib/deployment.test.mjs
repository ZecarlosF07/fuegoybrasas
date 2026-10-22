import assert from "node:assert/strict";
import test from "node:test";

import { deploymentProblems, launchReadiness, OFFICIAL_SUPABASE_URL } from "./deployment.mjs";

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: OFFICIAL_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_release",
  SUPABASE_SECRET_KEY: "sb_secret_synthetic_release", STAFF_AUTH_FLOW_SECRET: "synthetic-release-secret-long-enough",
  APP_SITE_URL: "https://deployment.example.test", APP_RELEASE_ID: "a".repeat(40),
};

test("publicación exige origen HTTPS y versión reproducible", () => {
  assert.deepEqual(deploymentProblems(environment), []);
  assert.deepEqual(deploymentProblems({ ...environment, APP_SITE_URL: "http://localhost:3000", APP_RELEASE_ID: "" }), ["SITE_URL", "RELEASE_ID"]);
});
test("preview y otros proyectos no reciben el perfil oficial", () => {
  assert.ok(deploymentProblems({ ...environment, VERCEL_ENV: "preview" }).includes("PREVIEW_OFFICIAL_DATABASE"));
  assert.ok(deploymentProblems({ ...environment, NEXT_PUBLIC_SUPABASE_URL: "https://other.example.test" }).includes("SUPABASE_PROJECT"));
});
test("destinos con credenciales, rutas o parámetros no son orígenes de aplicación", () => {
  for (const site of ["https://user:password@example.test", "https://example.test/path", "https://example.test/?token=example", "https://example.test/#private", "not-a-url"]) {
    assert.ok(deploymentProblems({ ...environment, APP_SITE_URL: site }).includes("SITE_URL"));
  }
});
test("servidor incompleto no pasa la preparación", () => {
  assert.ok(deploymentProblems({ ...environment, SUPABASE_SECRET_KEY: "", STAFF_AUTH_FLOW_SECRET: "short" }).includes("SERVER_KEYS"));
});
test("SHA suministrado por Vercel se usa si el override está vacío", () => {
  assert.deepEqual(deploymentProblems({ ...environment, APP_RELEASE_ID: "", VERCEL_GIT_COMMIT_SHA: "b".repeat(40) }), []);
});

test("WhatsApp no depende de pagos configurados, costo del premio ni textos de fidelización", () => {
  const features = launchReadiness({ activeManagers: 1, locationVerified: true, confirmedPayments: 0, rewardCostCents: null }, environment);
  assert.deepEqual(features.ordering, { ready: true, problems: [] });
  assert.deepEqual(features.loyalty, { ready: false, problems: ["LOYALTY_DOCUMENTS"] });
});

test("el programa puede estar preparado con costo desconocido y documentos aprobados", () => {
  const features = launchReadiness({ activeManagers: 1, locationVerified: true, rewardCostCents: null }, { ...environment, LOYALTY_TERMS_APPROVED: "true", LOYALTY_PRIVACY_APPROVED: "true" });
  assert.equal(features.ordering.ready, true);
  assert.equal(features.loyalty.ready, true);
});

test("configuración incompleta o ausencia de administrador conserva bloqueos reales", () => {
  assert.equal(launchReadiness({ activeManagers: 1, locationVerified: true }, environment, false).ordering.ready, false);
  assert.ok(launchReadiness({ activeManagers: 0, locationVerified: true }, environment).ordering.problems.includes("ADMINISTRATOR"));
});
