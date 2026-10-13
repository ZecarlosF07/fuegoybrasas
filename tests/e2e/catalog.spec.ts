import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { cleanupCatalogE2E, E2E_CATEGORY_SLUG, E2E_DRAFT, E2E_IMAGE, E2E_SLUG, E2E_SOLD_OUT, prepareCatalogE2E } from "./catalog-fixture";
import { evidenceDirectory } from "./evidence";
import { catalogSchema } from "../../src/features/catalog/validation/schemas";

test.describe.configure({ mode: "serial" });
test.beforeAll(prepareCatalogE2E);
test.afterAll(cleanupCatalogE2E);
const screenshots = evidenceDirectory("h3/capturas");

test("carta, categorías y vuelta conservan contexto sin sesión", async ({ page, request }) => {
  const response = await request.get("/api/catalog");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(catalogSchema.parse(body.data).items.some((item) => item.name === "Borrador confidencial H3")).toBe(false);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Categorías de la carta" }).getByRole("link", { name: "Pruebas H3" }).click();
  await expect(page).toHaveURL(new RegExp(`categoria=${E2E_CATEGORY_SLUG}#carta$`));
  await expect(page.locator("#carta article")).toHaveCount(2);
  await expect(page.getByText("Desde S/14.90")).toBeVisible();
  await expect(page.getByText("Borrador confidencial H3")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver detalle de Plato sintético H3, Porción sintética" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plato sintético H3");
  await expect(page.getByRole("heading", { name: "Precio según modalidad" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la carta" }).click();
  await expect(page).toHaveURL(new RegExp(`categoria=${E2E_CATEGORY_SLUG}#carta$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/productos/${E2E_SLUG}`));
});

test("detalle agotado, borrador y metadata segura", async ({ page }) => {
  await page.goto(`/productos/h3-e2e-${E2E_SOLD_OUT}`);
  await expect(page.getByText("Agotado por ahora")).toBeVisible();
  await expect(page.getByRole("button", { name: /Agregar|Pedir/ })).toHaveCount(0);
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/detalle-agotado-${width}.png`, fullPage: true });
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  const response = await page.goto(`/productos/h3-e2e-${E2E_DRAFT}`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Este producto no está disponible" })).toBeVisible();
  await expect(page.getByText("Borrador confidencial H3")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]').last()).toHaveAttribute("content", /noindex/);
  await page.screenshot({ path: `${screenshots}/no-encontrado.png`, fullPage: true });
});

test("imagen cargada y fallida: el texto comercial permanece legible", async ({ page }) => {
  // PNG abstracto de prueba: verifica carga y layout; no representa comida ni una foto real.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64");
  await page.route("**/_next/image?**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: png }));
  await page.goto(`/productos/${E2E_SLUG}`);
  const image = page.getByAltText("Plato sintético H3, Porción sintética");
  await expect(image).toBeVisible();
  expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: `${screenshots}/imagen-sintetica.png`, fullPage: true });
  await page.unroute("**/_next/image?**");
  await page.route("**/_next/image?**", (route) => route.fulfill({ status: 404, body: "Recurso no disponible" }));
  await page.reload();
  await expect(page.getByText("Foto próximamente")).toBeVisible();
  await expect(page.getByText("Desde S/14.90")).toBeVisible();
  await page.screenshot({ path: `${screenshots}/imagen-fallida.png`, fullPage: true });
  expect(E2E_IMAGE).toContain("items/");
});

