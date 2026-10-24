import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { signInStaffBrowser } from "./staff-browser";
import { E2E_ORIGIN } from "./environment";
import { evidenceDirectory } from "./evidence";
import { cleanupStaffFixtures, createStaffFixture, staffPool } from "../integration/staff-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

test.describe.configure({ mode: "serial", timeout: 90000 });
test.use({ trace: "off" });
const category = randomUUID(), item = randomUUID(), price = randomUUID(), group = randomUUID(), choice = randomUUID(), zone = randomUUID();
const slug = `h5-e2e-${item}`;
const screenshots = evidenceDirectory("h5/capturas");
let manager: StaffFixture, cookies: Awaited<ReturnType<BrowserContext["cookies"]>>, original: Record<string, unknown>;
const extraZones: string[] = [];
test.beforeAll(async ({ browser }) => {
  original = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  manager = await createStaffFixture("manager");
  await staffPool.query("begin");
  await staffPool.query("insert into public.categories(id,slug,name,active) values($1,'h5-e2e-'||$1::uuid::text,'Pruebas H5',true)", [category]);
  await staffPool.query("insert into public.catalog_items(id,category_id,slug,name,kind,portion_label) values($1,$2,$3,'Mostrito de prueba H5','regular','⅛ de pollo sintético')", [item, category, slug]);
  await staffPool.query("insert into public.catalog_prices(id,item_id,mode,price_cents,verified) values($1,$2,'delivery',1590,true),(gen_random_uuid(),$2,'pickup',1590,true)", [price, item]);
  await staffPool.query("insert into public.option_groups(id,item_id,name,min_choices,max_choices,active,verified) values($1,$2,'Salsa de prueba',1,1,true,true)", [group, item]);
  await staffPool.query("insert into public.option_choices(id,group_id,label,extra_price_cents,available,verified) values($1,$2,'Salsa sintética',100,true,true)", [choice, group]);
  await staffPool.query("update public.catalog_items set publication_status='published',online_enabled=true,content_verified=true where id=$1", [item]);
  await staffPool.query("insert into public.delivery_zones(id,name,coverage,fee_cents,minimum_subtotal_cents,enabled,verified) values($1,'Zona sintética H5','allowed',300,1000,true,true)", [zone]);
  await staffPool.query("update public.business_settings set ordering_enabled=true,location_verified=true,address='Ubicación sintética H5',pickup_charges_verified=true,pickup_extra_cents=0 where id=1");
  await staffPool.query("commit");
  const context = await browser.newContext({ baseURL: E2E_ORIGIN });
  const page = await context.newPage(); await signInStaffBrowser(page, manager); cookies = await context.cookies(); await context.close();
});
test.afterAll(async () => {
  await staffPool.query("update public.business_settings set ordering_enabled=false where id=1");
  await staffPool.query("begin");
  for (const table of ["delivery_zones", "option_choices", "option_groups", "catalog_prices", "catalog_items", "categories"]) await staffPool.query(`alter table public.${table} disable trigger catalog_no_delete`);
  await staffPool.query("delete from public.delivery_zones where id=any($1::uuid[])", [[zone, ...extraZones]]);
  await staffPool.query("delete from public.option_choices where group_id=$1", [group]); await staffPool.query("delete from public.option_groups where id=$1", [group]); await staffPool.query("delete from public.catalog_prices where item_id=$1", [item]); await staffPool.query("delete from public.catalog_items where id=$1", [item]); await staffPool.query("delete from public.categories where id=$1", [category]);
  for (const table of ["delivery_zones", "option_choices", "option_groups", "catalog_prices", "catalog_items", "categories"]) await staffPool.query(`alter table public.${table} enable trigger catalog_no_delete`);
  if (original) await staffPool.query("update public.business_settings set ordering_enabled=$1,location_verified=$2,address=$3,pickup_charges_verified=$4,pickup_extra_cents=$5,revision=$6,updated_at=$7 where id=1", [original.ordering_enabled, original.location_verified, original.address, original.pickup_charges_verified, original.pickup_extra_cents, original.revision, original.updated_at]);
  await staffPool.query("commit");
  if (manager) await cleanupStaffFixtures([manager]); await staffPool.end();
});
async function addProduct(page: Page, instructions = "Sin ají sintético") {
  await page.goto(`/productos/${slug}`);
  await expect(page.getByLabel("Modalidad", { exact: true })).toHaveCount(0);
  await page.getByLabel("Salsa sintética (+S/1.00)", { exact: true }).check();
  await page.getByLabel("Indicaciones para este producto (opcional)").fill(instructions);
  await page.getByRole("button", { name: "Agregar al pedido", exact: true }).click();
  await expect(page.getByText("Producto agregado. Puedes seguir eligiendo o revisar el pedido.")).toBeVisible();
  await page.getByRole("link", { name: "Revisar pedido", exact: true }).click(); await expect(page).toHaveURL(/\/pedido$/);
}
async function prepare(page: Page) { await page.getByRole("button", { name: "Preparar mensaje de WhatsApp", exact: true }).click(); }
async function checkLayout(page: Page, step: string) {
  await expect(page).toHaveTitle(/Fuego y Brasas/);
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("complementary", { name: "Resumen del pedido" })).toHaveCount(0);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/${step}-${width}.png`, fullPage: true });
  }
}

test("invitado: solo platos, sin modalidad ni datos logísticos, WhatsApp sin escrituras de pedidos", async ({ page }) => {
  await page.goto("/pedido"); await expect(page.getByText("Tu pedido está vacío. Elige productos en la carta para comenzar.")).toBeVisible();
  await addProduct(page); await page.reload(); await expect(page.getByLabel("Indicaciones del producto (opcional)")).toHaveValue("Sin ají sintético");
  for (const label of ["Modalidad del pedido", "Tu nombre", "Dirección de entrega", "Zona", "Medio de pago"]) await expect(page.getByLabel(label, { exact: true })).toHaveCount(0);
  await checkLayout(page, "carrito-solo-platos");
  await page.getByLabel("Cantidad", { exact: true }).focus(); expect(await page.getByLabel("Cantidad", { exact: true }).evaluate(el => getComputedStyle(el).outlineWidth)).toBe("2px");
  await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/); await checkLayout(page, "whatsapp-solo-platos");
  const text = await page.getByLabel("Mensaje completo para WhatsApp").inputValue();
  expect(text).toContain("Sin ají sintético"); expect(text).toContain("S/16.90"); expect(text).toContain("costo de envío por este chat");
  expect(text).not.toMatch(/Modalidad:|Nombre:|Dirección:|Zona:|Cargo:|Total:|Pago:|Cambio para:/);
  const link = page.getByRole("link", { name: "Abrir WhatsApp", exact: true }); const href = await link.getAttribute("href");
  expect(new URL(href ?? "").origin + new URL(href ?? "").pathname).toBe("https://wa.me/51982042493"); expect(new URL(href ?? "").searchParams.get("text")).toBe(text);
  expect(await page.evaluate(() => localStorage.getItem("fyb.cart.v1"))).not.toContain("Sin ají sintético");
  await page.route("https://wa.me/**", route => route.fulfill({ status: 200, body: "Chat sintético" }));
  const popup = page.waitForEvent("popup"); await link.click(); await (await popup).close();
  await expect(page.getByRole("heading", { name: "Solicitud preparada", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver y editar pedido" }).click(); await expect(page).toHaveURL(/\/pedido$/);
  expect((await staffPool.query("select to_regclass('public.orders') is null absent")).rows[0].absent).toBe(true);
});

test("API estricta sin modalidad/PII, subtotal canónico sin usar cargos configurados", async ({ page }) => {
  const snapshot = (await (await page.request.get("/api/catalog")).json()).data; const product = snapshot.items.find((value: { id: string }) => value.id === item);
  const input = { lines: [{ lineId: randomUUID(), itemId: item, quantity: 2, choiceIds: [choice], observedItemRevision: product.revision, observedUnitPriceCents: 1690 }] };
  const historyBefore = (await staffPool.query("select (select count(*)::int from app_private.operation_receipts) receipts,(select count(*)::int from app_private.audit_entries) audits,(select revision from public.business_settings where id=1) revision")).rows[0];
  const response = await page.request.post("/api/cart/validate", { data: input }); expect(response.status()).toBe(200); expect(response.headers()["cache-control"]).toBe("no-store");
  expect((await response.json()).data.totals).toEqual({ subtotalCents: 3380 });
  const historyAfter = (await staffPool.query("select (select count(*)::int from app_private.operation_receipts) receipts,(select count(*)::int from app_private.audit_entries) audits,(select revision from public.business_settings where id=1) revision")).rows[0]; expect(historyAfter).toEqual(historyBefore);
  for (const extra of [{ name: "Dato privado" }, { mode: "delivery" }, { deliveryZoneId: zone }]) expect((await page.request.post("/api/cart/validate", { data: { ...input, ...extra } })).status()).toBe(400);
  expect((await page.request.post("/api/cart/validate", { data: input, headers: { Origin: "https://example.test" } })).status()).toBe(403);
  expect((await page.request.post("/api/cart/validate", { data: "x".repeat(32769), headers: { "Content-Type": "application/json" } })).status()).toBe(413);
  expect((await page.request.post("/api/cart/validate", { data: { ...input, lines: [{ ...input.lines[0], quantity: 21 }] } })).status()).toBe(400);
});

test("cambio de precio exige aceptación expresa y conserva las indicaciones", async ({ page }) => {
  await addProduct(page); await page.getByText("Añadir indicaciones generales (opcional)", { exact: true }).click();
  await page.getByLabel("Indicaciones generales (opcional)").fill("Sin salsas adicionales");
  await staffPool.query("begin"); await staffPool.query("update public.catalog_prices set price_cents=1690 where item_id=$1", [item]); await staffPool.query("update public.catalog_prices set verified=true where item_id=$1", [item]); await staffPool.query("commit");
  await prepare(page); await expect(page.getByRole("heading", { name: "Revisa los cambios antes de continuar" })).toBeVisible(); await expect(page).toHaveURL(/\/pedido$/);
  await expect(page.getByLabel("Indicaciones generales (opcional)")).toHaveValue("Sin salsas adicionales");
  await page.getByRole("button", { name: "Aceptar precios y versiones actuales" }).click(); await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  expect(await page.getByLabel("Mensaje completo para WhatsApp").inputValue()).toContain("S/17.90");
});

test("indicaciones perdidas, borrador corrupto y otra pestaña se recuperan expresamente", async ({ page, context }) => {
  await addProduct(page); await page.evaluate(() => sessionStorage.removeItem("fyb.checkout.v1")); await page.reload();
  await expect(page.getByText(/Las indicaciones de este producto no se recuperaron/)).toBeVisible(); await page.getByRole("button", { name: "Confirmar sin indicaciones", exact: true }).click();
  const other = await context.newPage(); await other.goto("/pedido"); await other.getByLabel("Cantidad", { exact: true }).fill("2"); await other.getByRole("button", { name: "Guardar producto e indicaciones" }).click();
  await expect(page.getByRole("button", { name: "Cargar versión de la otra pestaña" })).toBeVisible(); await page.getByRole("button", { name: "Cargar versión de la otra pestaña" }).click(); await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("2"); await other.close();
  await page.evaluate(() => localStorage.setItem("fyb.cart.v1", '{"schemaVersion":2}')); await page.reload(); await expect(page.getByText(/borrador incompatible o dañado/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("fyb.cart.v1"))).toBe('{"schemaVersion":2}'); await page.getByRole("button", { name: "Descartar borrador y empezar otro" }).click(); await expect(page.getByText("Tu pedido está vacío. Elige productos en la carta para comenzar.")).toBeVisible();
});

test("revisión expirada y clipboard denegado conservan el mensaje", async ({ page }) => {
  await addProduct(page); await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denegado"); } } }));
  await page.getByRole("button", { name: "Copiar mensaje completo" }).click(); await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos copiar"); await expect(page.getByLabel("Mensaje completo para WhatsApp")).toBeFocused();
  await page.evaluate(() => { const originalNow = performance.now.bind(performance); Object.defineProperty(performance, "now", { configurable: true, value: () => originalNow() + 61000 }); });
  await expect(page.getByText("La revisión venció. Revalida precios y disponibilidad para continuar.")).toBeVisible(); await expect(page.getByRole("link", { name: "Abrir WhatsApp", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Revalidar antes de abrir WhatsApp" }).click(); await expect(page.getByRole("link", { name: "Abrir WhatsApp", exact: true })).toBeVisible();
});

test("fallo de conexión conserva platos y el enlace antiguo de datos lleva al pedido", async ({ page }) => {
  await addProduct(page); await page.goto("/pedido/datos"); await expect(page).toHaveURL(/\/pedido$/);
  await page.route("**/api/cart/validate", route => route.abort("failed"), { times: 1 }); await prepare(page);
  await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos validar"); await expect(page.getByLabel("Indicaciones del producto (opcional)")).toHaveValue("Sin ají sintético");
  await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  await page.getByRole("button", { name: "Empezar un nuevo pedido", exact: true }).click(); await page.getByRole("button", { name: "Conservar mi pedido", exact: true }).click(); await expect(page.getByRole("heading", { name: "Solicitud preparada", exact: true })).toBeVisible();
});

test("un plato sin opciones obligatorias se agrega directamente desde la carta", async ({ page }) => {
  await page.goto("/?categoria=mostritos#carta");
  const card = page.locator("#carta article").filter({ has: page.getByRole("button", { name: /^Agregar / }) }).first();
  await card.getByRole("button", { name: /^Agregar / }).click();
  await expect(page.getByRole("complementary", { name: "Resumen del pedido" })).toBeVisible();
  await expect(card.getByRole("status")).toContainText("Agregado.");
});

test("un límite del pedido muestra error solo en el plato que intentó agregarse", async ({ page }) => {
  await page.goto("/?categoria=mostritos#carta");
  const card = page.locator("#carta article").filter({ has: page.getByRole("button", { name: /^Agregar / }) }).first();
  await card.getByRole("button", { name: /^Agregar / }).click();
  await page.goto("/pedido");
  await page.getByLabel("Cantidad", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Guardar producto e indicaciones", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Producto actualizado.");
  await page.goto("/?categoria=mostritos#carta");
  await card.getByRole("button", { name: /^Agregar / }).click();
  await expect(card.getByRole("alert")).toContainText("No pudimos agregar este plato.");
  await expect(page.locator("#carta article [role=alert]")).toHaveCount(1);
  await expect(page.getByRole("complementary", { name: "Resumen del pedido" })).toContainText("20 productos");
});
test("configuración privada conserva zonas sin exigir pagos", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/configuracion");
  await expect(page.getByRole("button", { name: "Crear medio de pago", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Crear zona", exact: true }).click();
  const editor = page.getByRole("region", { name: "Editor de condiciones" });
  await editor.getByLabel("Nombre de la zona").fill("Zona adicional de prueba H5");
  await editor.getByLabel("Cargo (soles, opcional)").fill("2.50");
  await editor.getByRole("button", { name: "Guardar condiciones", exact: true }).click();
  const label = "Zona adicional de prueba H5";
  await expect(page.getByRole("button", { name: label + " · pendiente" })).toBeVisible();
  const id = (await staffPool.query("select id from public.delivery_zones where name=$1", [label])).rows[0].id;
  extraZones.push(id);
  await page.getByRole("button", { name: label + " · pendiente" }).click();
  await editor.getByLabel("Motivo (10–500 caracteres)").fill("Retiro sintético de prueba H5");
  await editor.getByRole("button", { name: "Confirmar retiro", exact: true }).click();
  await page.getByLabel("Mostrar condiciones retiradas").check();
  await page.getByRole("button", { name: label + " · retirada" }).click();
  await editor.getByLabel("Motivo (10–500 caracteres)").fill("Restauración sintética H5");
  await editor.getByRole("button", { name: "Confirmar restauración", exact: true }).click();
  expect((await staffPool.query("select enabled,verified from public.delivery_zones where id=$1", [id])).rows[0]).toEqual({ enabled: false, verified: false });
  await page.screenshot({ path: screenshots + "/configuracion-condiciones.png", fullPage: true });
});
