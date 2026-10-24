import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { evidenceDirectory } from "./evidence";

const EVIDENCE_DIR = evidenceDirectory("h3/capturas");
const VIEWPORT_WIDTHS = [360, 390, 768, 1280];

for (const width of VIEWPORT_WIDTHS) {
  test(`base visual a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sabor que une,momentos que quedan.");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
    const action = page.getByRole("link", { name: "Ver carta", exact: true });
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
    await page.screenshot({ path: `${EVIDENCE_DIR}/inicio-${width}.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("teclado: salto al contenido y foco completamente visible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  const link = page.locator("main").getByRole("link").first();
  await expect(link).toBeFocused();
  const outline = await link.evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(outline).toBe("2px");
  const box = await link.boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
  await page.screenshot({ path: `${EVIDENCE_DIR}/foco-teclado.png`, fullPage: true });
});

test("reflujo equivalente a zoom 200% y 400%; movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("link", { name: "Ver carta", exact: true })).toBeVisible();
  }
  await page.screenshot({ path: `${EVIDENCE_DIR}/reflujo-320.png`, fullPage: true });
});

test("la respuesta pública no contiene la clave secreta", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const html = await response?.text();
  expect(html).not.toContain("SUPABASE_SECRET_KEY");
  expect(html).not.toContain("sb_secret_");
});

test("marca y salto de teclado presentes en tarjeta y páginas informativas", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of ["/mi-tarjeta/acceso", "/privacidad", "/condiciones-tarjeta"]) {
    await page.goto(path);
    await expect(page.locator("header img")).toBeVisible();
    await expect(page.getByRole("link", { name: "Mi pedido", exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#contenido")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});
