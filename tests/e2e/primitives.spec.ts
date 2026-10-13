import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import { evidenceDirectory } from "./evidence";

const EVIDENCE_DIR = evidenceDirectory("h1/capturas");
const markup = readFileSync(".test-fixtures/ui/primitives.html", "utf8");

for (const width of [360, 1280]) {
  test(`primitivas, errores y foco a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    // Fixture de navegador: componentes reales + estilos de producción.
    // No añade una ruta ni acciones comerciales a la aplicación.
    await page.locator("main").evaluate((element, html) => { element.innerHTML = html; }, markup);
    const input = page.getByRole("textbox", { name: "Nombre" });
    await input.focus();
    await expect(input).toHaveAccessibleDescription("Datos sintéticos para revisión. Revisa este dato.");
    await expect(input).toHaveValue("Cliente de prueba");
    await expect(page.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(await input.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("2px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({ path: `${EVIDENCE_DIR}/controles-${width}.png`, fullPage: true });
  });
}
