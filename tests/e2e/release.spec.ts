import { expect, test } from "@playwright/test";

test("H8: salud mínima, cabeceras y buscadores en entorno de pruebas", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", release: "unversioned" });
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});
