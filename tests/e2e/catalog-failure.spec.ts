import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { evidenceDirectory } from "./evidence";
import type { CategoryIdentifier } from "../integration/types/catalog-fixture";

const connectionString = process.env.SUPABASE_LOCAL_DB_URL;
if (!connectionString || !["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname)) throw new Error("Los fallos controlados solo se permiten en PostgreSQL local.");
const pool = new Pool({ connectionString, max: 1 });
test.describe.configure({ mode: "serial" });
test.afterAll(async () => { await pool.query("grant execute on function public.read_catalog() to anon"); await pool.end(); });
const screenshots = evidenceDirectory("h3/capturas");

test("fallo real de RPC y reintento real de carta/detalle sin dobles consultas", async ({ page, request }) => {
  await pool.query("revoke execute on function public.read_catalog() from anon");
  try {
    const response = await request.get("/api/catalog");
    expect(response.status()).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE" } });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    await expect(page.getByText("No pudimos cargar la carta. Inténtalo otra vez en un momento.")).toBeVisible();
    await page.getByRole("button", { name: "Volver a intentar" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos cargar la carta");
    await expect(page.getByRole("button", { name: "Volver a intentar" })).toBeEnabled();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/error-catalogo.png`, fullPage: true });
  } finally { await pool.query("grant execute on function public.read_catalog() to anon"); }
  const deferred = Promise.withResolvers<void>();
  let calls = 0;
  await page.route("**/api/catalog", async (route) => { calls += 1; await deferred.promise; await route.continue(); });
  await page.getByRole("button", { name: "Volver a intentar" }).click();
  const loading = page.getByRole("button", { name: "Consultando la carta…" });
  await expect(loading).toBeDisabled();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await page.screenshot({ path: `${screenshots}/consultando-catalogo.png`, fullPage: true });
  deferred.resolve();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sabor que une,momentos que quedan.");
  await expect(page.locator("main")).toBeFocused();
  expect(calls).toBe(1);
  await page.unroute("**/api/catalog");
  await pool.query("revoke execute on function public.read_catalog() from anon");
  try { await page.goto("/productos/gran-promocion?categoria=promociones"); }
  finally { await pool.query("grant execute on function public.read_catalog() to anon"); }
  await page.getByRole("button", { name: "Volver a intentar" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gran Promoción");
  await expect(page.getByRole("link", { name: "Volver a la carta" })).toHaveAttribute("href", "/?categoria=promociones#carta");
});

test("catálogo vacío real no presenta categorías ni productos inventados", async ({ page }) => {
  const active = await pool.query<CategoryIdentifier>("select id from public.categories where active");
  const categoryIds = active.rows.map((row) => row.id);
  await pool.query("update public.categories set active=false where id=any($1::uuid[])", [categoryIds]);
  try {
    await page.goto("/");
    await expect(page.getByText("Estamos preparando nuestra carta.")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Categorías de la carta" })).toHaveCount(0);
    await expect(page.locator("article")).toHaveCount(0);
    await page.screenshot({ path: `${screenshots}/carta-vacia.png`, fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  } finally { await pool.query("update public.categories set active=true where id=any($1::uuid[])", [categoryIds]); }
});
