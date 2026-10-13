import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { enrollStaffBrowser } from "./staff-browser";
import { evidenceDirectory } from "./evidence";
import { cleanupStaffFixtures, createStaffFixture, staffPool } from "../integration/staff-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

test.describe.configure({ mode: "serial", timeout: 90000 });
test.use({ trace: "off" });
const category = randomUUID(), item = randomUUID(), price = randomUUID(), group = randomUUID(), choice = randomUUID(), payment = randomUUID(), zone = randomUUID();
const slug = `h5-e2e-${item}`, code = `h5-${payment}`;
const screenshots = evidenceDirectory("h5/capturas");
let manager: StaffFixture, cookies: Awaited<ReturnType<BrowserContext["cookies"]>>, original: Record<string, unknown>;
const extraPayments: string[] = [], extraZones: string[] = [], extraCodes: string[] = [];
test.beforeAll(async ({ browser }) => {
  original = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  manager = await createStaffFixture("manager");
  await staffPool.query("begin");
  await staffPool.query("insert into public.categories(id,slug,name,active) values($1,'h5-e2e-'||$1::uuid::text,'Pruebas H5',true)", [category]);
  await staffPool.query("insert into public.catalog_items(id,category_id,slug,name,kind,portion_label) values($1,$2,$3,'Mostrito de prueba H5','regular','⅛ de pollo sintético')", [item, category, slug]);
  await staffPool.query("insert into public.catalog_prices(id,item_id,mode,price_cents,verified) values($1,$2,'delivery',1590,true),(gen_random_uuid(),$2,'pickup',1490,true)", [price, item]);
  await staffPool.query("insert into public.option_groups(id,item_id,name,min_choices,max_choices,active,verified) values($1,$2,'Salsa de prueba',1,1,true,true)", [group, item]);
  await staffPool.query("insert into public.option_choices(id,group_id,label,extra_price_cents,available,verified) values($1,$2,'Salsa sintética',100,true,true)", [choice, group]);
  await staffPool.query("update public.catalog_items set publication_status='published',online_enabled=true,content_verified=true where id=$1", [item]);
  await staffPool.query("insert into public.payment_methods(id,code,label,needs_change,enabled,verified) values($1,$2,'Pago sintético H5',true,true,true)", [payment, code]);
  await staffPool.query("insert into public.delivery_zones(id,name,coverage,fee_cents,minimum_subtotal_cents,enabled,verified) values($1,'Zona sintética H5','allowed',300,1000,true,true)", [zone]);
  await staffPool.query("update public.business_settings set ordering_enabled=true,location_verified=true,address='Ubicación sintética H5',pickup_charges_verified=true,pickup_extra_cents=0 where id=1");
  await staffPool.query("commit");
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
  const page = await context.newPage(); await enrollStaffBrowser(page, manager); cookies = await context.cookies(); await context.close();
});
test.afterAll(async () => {
  await staffPool.query("update public.business_settings set ordering_enabled=false where id=1");
  await staffPool.query("begin");
  for (const table of ["payment_methods", "delivery_zones", "option_choices", "option_groups", "catalog_prices", "catalog_items", "categories"]) await staffPool.query(`alter table public.${table} disable trigger catalog_no_delete`);
  await staffPool.query("delete from public.payment_methods where id=any($1::uuid[]) or code=any($2::text[])", [[payment, ...extraPayments], extraCodes]); await staffPool.query("delete from public.delivery_zones where id=any($1::uuid[])", [[zone, ...extraZones]]);
  await staffPool.query("delete from public.option_choices where group_id=$1", [group]); await staffPool.query("delete from public.option_groups where id=$1", [group]); await staffPool.query("delete from public.catalog_prices where item_id=$1", [item]); await staffPool.query("delete from public.catalog_items where id=$1", [item]); await staffPool.query("delete from public.categories where id=$1", [category]);
  for (const table of ["payment_methods", "delivery_zones", "option_choices", "option_groups", "catalog_prices", "catalog_items", "categories"]) await staffPool.query(`alter table public.${table} enable trigger catalog_no_delete`);
  if (original) await staffPool.query("update public.business_settings set ordering_enabled=$1,location_verified=$2,address=$3,pickup_charges_verified=$4,pickup_extra_cents=$5,revision=$6,updated_at=$7 where id=1", [original.ordering_enabled, original.location_verified, original.address, original.pickup_charges_verified, original.pickup_extra_cents, original.revision, original.updated_at]);
  await staffPool.query("commit");
  if (manager) await cleanupStaffFixtures([manager]); await staffPool.end();
});
async function addProduct(page: Page, instructions = "Sin ají sintético") {
  await page.goto(`/productos/${slug}`); await page.getByLabel("Salsa sintética (+S/1.00)", { exact: true }).check();
  await page.getByLabel("Indicaciones para este producto (opcional)").fill(instructions);
  await page.getByRole("button", { name: "Agregar al pedido", exact: true }).click(); await expect(page.getByText("Producto agregado. Puedes seguir eligiendo o revisar el pedido.")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Resumen del pedido" })).toBeVisible();
  await page.getByRole("link", { name: "Revisar pedido", exact: true }).click(); await expect(page).toHaveURL(/\/pedido$/);
}
async function fillCheckout(page: Page) {
  await page.getByRole("link", { name: "Continuar con mis datos", exact: true }).click(); await expect(page).toHaveURL(/\/pedido\/datos$/);
  await page.getByLabel("Tu nombre").fill("Cliente sintético"); await page.getByLabel("Dirección de entrega").fill("Dirección sintética 123");
  await page.getByLabel("Medio de pago").selectOption(code);
}
async function prepare(page: Page) { await page.getByRole("button", { name: "Preparar mensaje de WhatsApp", exact: true }).click(); }
async function checkCheckoutLayout(page: Page, step: string) {
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("complementary", { name: "Resumen del pedido" })).toHaveCount(0);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/${step}-${width}.png`, fullPage: true });
  }
}

test("invitado móvil: datos, cargos pendientes, mensaje íntegro y retorno sin venta/escrituras", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto("/pedido"); await expect(page.getByText("Tu pedido está vacío. Elige productos en la carta para comenzar.")).toBeVisible();
  await page.screenshot({ path: `${screenshots}/carrito-vacio.png`, fullPage: true });
  await addProduct(page); await page.reload(); await expect(page.getByLabel("Indicaciones del producto (opcional)")).toHaveValue("Sin ají sintético");
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/carrito-${width}.png`, fullPage: true });
  }
  await fillCheckout(page); await checkCheckoutLayout(page, "datos");
  await page.getByLabel("Tu nombre").focus(); await page.keyboard.press("Tab");
  const address = page.getByLabel("Dirección de entrega"); await expect(address).toBeFocused();
  const focusBox = await address.boundingBox(); expect(focusBox?.y).toBeGreaterThanOrEqual(0);
  expect((focusBox?.y ?? 0) + (focusBox?.height ?? 0)).toBeLessThanOrEqual(900);
  expect(await address.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("2px");
  await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/); await checkCheckoutLayout(page, "continuar");
  const text = await page.getByLabel("Mensaje completo para WhatsApp").inputValue();
  expect(text).toContain("Sin ají sintético"); expect(text).toContain("S/16.90"); expect(text).toContain("Total: por confirmar"); expect(text).toContain("Dirección sintética 123");
  const link = page.getByRole("link", { name: "Abrir WhatsApp", exact: true }); const href = await link.getAttribute("href"); expect(href).toMatch(/^https:\/\/wa.me\/51982042493\?text=/);
  expect(new URL(href ?? "").searchParams.get("text")).toBe(text);
  const local = await page.evaluate(() => localStorage.getItem("fyb.cart.v1")); for (const pii of ["Cliente sintético", "Dirección sintética", "Sin ají sintético"]) expect(local).not.toContain(pii);
  await page.route("https://wa.me/**", (route) => route.fulfill({ status: 200, body: "Chat sintético para inspección del enlace" }));
  const popup = page.waitForEvent("popup"); await link.click(); const chat = await popup; await chat.close();
  await expect(page.getByRole("heading", { name: "Solicitud preparada", exact: true })).toBeVisible(); await page.getByRole("link", { name: "Volver y editar datos" }).click(); await expect(page.getByLabel("Tu nombre")).toHaveValue("Cliente sintético");
  expect((await staffPool.query("select to_regclass('public.orders') is null absent")).rows[0].absent).toBe(true);
});

test("API estricta sin PII, cantidades acotadas y respuesta canónica real", async ({ page }) => {
  const snapshot = (await (await page.request.get("/api/catalog")).json()).data; const product = snapshot.items.find((value: { id: string }) => value.id === item);
  const input = { mode: "delivery", paymentMethodCode: code, deliveryZoneId: zone, lines: [{ lineId: randomUUID(), itemId: item, quantity: 2, choiceIds: [choice], observedItemRevision: product.revision, observedUnitPriceCents: 1690 }] };
  const historyBefore = (await staffPool.query("select (select count(*)::int from app_private.operation_receipts) receipts,(select count(*)::int from app_private.audit_entries) audits,(select revision from public.business_settings where id=1) revision")).rows[0];
  const response = await page.request.post("/api/cart/validate", { data: input }); expect(response.status()).toBe(200); expect(response.headers()["cache-control"]).toBe("no-store");
  const historyAfter = (await staffPool.query("select (select count(*)::int from app_private.operation_receipts) receipts,(select count(*)::int from app_private.audit_entries) audits,(select revision from public.business_settings where id=1) revision")).rows[0];
  expect(historyAfter).toEqual(historyBefore);
  expect((await response.json()).data.totals).toEqual({ subtotalCents: 3380, charge: { status: "known", amountCents: 300 }, totalCents: 3680 });
  const privateInput = await page.request.post("/api/cart/validate", { data: { ...input, name: "No enviar PII" } });
  expect(privateInput.status()).toBe(400); expect(await privateInput.text()).not.toContain("No enviar PII");
  expect((await page.request.post("/api/cart/validate", { data: input, headers: { Origin: "https://example.test" } })).status()).toBe(403);
  expect((await page.request.post("/api/cart/validate", { data: "x".repeat(32769), headers: { "Content-Type": "application/json" } })).status()).toBe(413);
  expect((await page.request.post("/api/cart/validate", { data: { ...input, lines: [{ ...input.lines[0], quantity: 21 }] } })).status()).toBe(400);
});

test("cambio de precio exige aceptación explícita, errores de datos conservan entrada", async ({ page }) => {
  await addProduct(page); await fillCheckout(page); await page.getByLabel("Tu nombre").fill(""); await prepare(page);
  await expect(page.locator("main").getByRole("alert")).toBeFocused(); await expect(page.getByLabel("Dirección de entrega")).toHaveValue("Dirección sintética 123");
  await page.screenshot({ path: `${screenshots}/errores-datos.png`, fullPage: true }); await page.getByLabel("Tu nombre").fill("Cliente sintético");
  await staffPool.query("begin"); await staffPool.query("update public.catalog_prices set price_cents=1690 where id=$1", [price]); await staffPool.query("update public.catalog_prices set verified=true where id=$1", [price]); await staffPool.query("commit");
  await prepare(page); await expect(page.getByRole("heading", { name: "Revisa los cambios antes de continuar" })).toBeVisible(); await expect(page).toHaveURL(/\/pedido\/datos$/);
  await page.screenshot({ path: `${screenshots}/precio-cambiado.png`, fullPage: true }); await page.getByRole("button", { name: "Aceptar precios y versiones actuales" }).click(); await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  expect(await page.getByLabel("Mensaje completo para WhatsApp").inputValue()).toContain("S/17.90");
});

test("indicaciones perdidas, borrador corrupto y edición entre pestañas se recuperan expresamente", async ({ page, context }) => {
  await addProduct(page); await page.evaluate(() => sessionStorage.removeItem("fyb.checkout.v1")); await page.reload();
  await expect(page.getByText(/Las indicaciones de este producto no se recuperaron/)).toBeVisible(); await page.screenshot({ path: `${screenshots}/indicaciones-perdidas.png`, fullPage: true });
  await page.getByRole("button", { name: "Confirmar sin indicaciones", exact: true }).click();
  const other = await context.newPage(); await other.goto("/pedido"); await other.getByLabel("Cantidad", { exact: true }).fill("2"); await other.getByRole("button", { name: "Guardar producto e indicaciones" }).click();
  await expect(page.getByRole("button", { name: "Cargar versión de la otra pestaña" })).toBeVisible(); await page.getByRole("button", { name: "Cargar versión de la otra pestaña" }).click(); await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("2"); await other.close();
  await page.evaluate(() => localStorage.setItem("fyb.cart.v1", '{"schemaVersion":2}')); await page.reload(); await expect(page.getByText(/borrador incompatible o dañado/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("fyb.cart.v1"))).toBe('{"schemaVersion":2}'); await page.getByRole("button", { name: "Descartar borrador y empezar otro" }).click(); await expect(page.getByText("Tu pedido está vacío. Elige productos en la carta para comenzar.")).toBeVisible();
});

test("revisión expirada y clipboard denegado conservan mensaje y ofrecen recuperación", async ({ page }) => {
  await addProduct(page); await fillCheckout(page); await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denegado"); } } }));
  await page.getByRole("button", { name: "Copiar mensaje completo" }).click(); await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos copiar");
  await expect(page.getByLabel("Mensaje completo para WhatsApp")).toBeFocused(); await page.screenshot({ path: `${screenshots}/copia-denegada.png`, fullPage: true });
  await page.evaluate(() => { const originalNow = performance.now.bind(performance); Object.defineProperty(performance, "now", { configurable: true, value: () => originalNow() + 61000 }); });
  await expect(page.getByText("La revisión venció. Revalida precios y disponibilidad para continuar.")).toBeVisible(); await expect(page.getByRole("link", { name: "Abrir WhatsApp", exact: true })).toHaveCount(0);
  await page.screenshot({ path: `${screenshots}/revision-expirada.png`, fullPage: true }); await page.getByRole("button", { name: "Revalidar antes de abrir WhatsApp" }).click(); await expect(page.getByRole("link", { name: "Abrir WhatsApp", exact: true })).toBeVisible();
});

test("configuración privada crea, retira y restaura pagos sin reactivar condiciones", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/configuracion"); await page.getByRole("button", { name: "Crear medio de pago", exact: true }).click();
  const editor = page.getByRole("region", { name: "Editor de pagos y zonas" }); const newCode = `h5-e2e-${randomUUID()}`; extraCodes.push(newCode);
  await editor.getByLabel("Código del pago").fill(newCode); await editor.getByLabel("Nombre del medio de pago").fill("Pago adicional de prueba H5"); await editor.getByRole("button", { name: "Guardar condiciones", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pago adicional de prueba H5 · pendiente" })).toBeVisible();
  const id = (await staffPool.query("select id from public.payment_methods where code=$1", [newCode])).rows[0].id; extraPayments.push(id);
  await page.getByRole("button", { name: "Pago adicional de prueba H5 · pendiente" }).click(); await editor.getByLabel("Motivo (10–500 caracteres)").fill("Retiro sintético de prueba H5"); await editor.getByRole("button", { name: "Confirmar retiro", exact: true }).click();
  await page.getByLabel("Mostrar condiciones retiradas").check(); await page.getByRole("button", { name: "Pago adicional de prueba H5 · retirado" }).click(); await editor.getByLabel("Motivo (10–500 caracteres)").fill("Restauración sintética H5"); await editor.getByRole("button", { name: "Confirmar restauración", exact: true }).click();
  expect((await staffPool.query("select enabled,verified from public.payment_methods where id=$1", [id])).rows[0]).toEqual({ enabled: false, verified: false });
  await page.getByRole("button", { name: "Crear zona", exact: true }).click(); await editor.getByLabel("Nombre de la zona").fill("Zona adicional de prueba H5"); await editor.getByLabel("Cargo (soles, opcional)").fill("2.50"); await editor.getByRole("button", { name: "Guardar condiciones", exact: true }).click();
  await expect(page.getByRole("button", { name: "Zona adicional de prueba H5 · pendiente" })).toBeVisible();
  extraZones.push((await staffPool.query("select id from public.delivery_zones where name='Zona adicional de prueba H5'")).rows[0].id);
  await page.screenshot({ path: `${screenshots}/configuracion-condiciones.png`, fullPage: true });
});


test("recojo válido y fallos de conexión conservan datos y nunca sustituyen productos", async ({ page }) => {
  await addProduct(page); await fillCheckout(page); await page.getByLabel("Modalidad del pedido").selectOption("pickup");
  await expect(page.getByLabel("Dirección de entrega")).toHaveCount(0);
  await prepare(page); await expect(page.getByRole("heading", { name: "Revisa los cambios antes de continuar" })).toBeVisible();
  await page.getByRole("button", { name: "Aceptar precios y versiones actuales" }).click(); await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  const message = await page.getByLabel("Mensaje completo para WhatsApp").inputValue();
  expect(message).toContain("Modalidad: Recojo"); expect(message).toContain("Total: S/15.90"); expect(message).not.toContain("Dirección sintética");
  await page.getByRole("link", { name: "Volver y editar datos" }).click(); await expect(page).toHaveURL(/\/pedido\/datos$/);
  await page.route("**/api/cart/validate", (route) => route.abort("failed"), { times: 1 }); await prepare(page);
  await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos validar"); await expect(page.getByLabel("Tu nombre")).toHaveValue("Cliente sintético");
  await page.screenshot({ path: `${screenshots}/servicio-fallido.png`, fullPage: true });
  await prepare(page); await expect(page).toHaveURL(/\/pedido\/continuar$/);
  await page.getByRole("button", { name: "Empezar un nuevo pedido", exact: true }).click(); await page.getByRole("button", { name: "Conservar mi pedido", exact: true }).click(); await expect(page.getByRole("heading", { name: "Solicitud preparada", exact: true })).toBeVisible();
});
