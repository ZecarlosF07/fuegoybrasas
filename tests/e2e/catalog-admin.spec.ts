import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { evidenceDirectory } from "./evidence";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "../integration/staff-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

test.describe.configure({ mode: "serial", timeout: 90000 });
test.use({ trace: "off" });
const root = "http://127.0.0.1:3100";
const screenshots = evidenceDirectory("h4/capturas");
const category = randomUUID(), item = randomUUID();
const paths: string[] = [];
let manager: StaffFixture;
let cookies: Awaited<ReturnType<BrowserContext["cookies"]>>;
let photo: Buffer;
test.beforeAll(async ({ browser }) => {
  manager = await createStaffFixture("manager");
  await staffPool.query("insert into public.categories(id,slug,name,active) values($1,'h4-e2e-'||$1::uuid::text,'Pruebas H4',true)", [category]);
  await staffPool.query("insert into public.catalog_items(id,category_id,slug,name,kind,portion_label,inclusions) values($1,$2,'h4-e2e-'||$1::uuid::text,'Producto de prueba H4','regular','Porción sintética',array['Inclusión sintética'])", [item, category]);
  photo = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).png().toBuffer();
  const context = await browser.newContext({ baseURL: root }); const page = await context.newPage();
  await page.goto("/personal/acceso"); await page.getByLabel("Correo electrónico").fill(manager.email); await page.getByLabel("Contraseña", { exact: true }).fill(manager.password); await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/personal$/); cookies = await context.cookies(); await context.close();
});
test.beforeEach(async ({ context, page }) => { await context.addCookies(cookies); await page.goto("/administracion/carta"); await expect(page.getByRole("heading", { name: "Administrar carta" })).toBeVisible(); });
test.afterAll(async () => {
  const connection = await staffPool.connect();
  try {
    await connection.query("begin");
    for (const table of ["catalog_prices", "catalog_items", "categories"]) await connection.query(`alter table public.${table} disable trigger catalog_no_delete`);
    await connection.query("delete from public.catalog_prices where item_id=$1", [item]);
    await connection.query("delete from public.catalog_items where id=$1", [item]); await connection.query("delete from public.categories where id=$1", [category]);
    for (const table of ["catalog_prices", "catalog_items", "categories"]) await connection.query(`alter table public.${table} enable trigger catalog_no_delete`);
    await connection.query("commit");
  } catch (error) { await connection.query("rollback"); throw error; } finally { connection.release(); }
  if (paths.length) expect((await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "").storage.from("catalog-media").remove(paths)).error).toBeNull();
  if (manager) await cleanupStaffFixtures([manager]); await staffPool.end();
});

test("editor móvil y teclado; publicación denegada, precio confirmado y carta actualizada", async ({ page }) => {
  await page.getByRole("button", { name: "Editar Producto de prueba H4", exact: true }).click();
  const editor = page.getByRole("region", { name: "Editor de carta" });
  await editor.getByLabel("Habilitado para la web").check(); await editor.getByLabel("Confirmo la porción y las inclusiones").check(); await editor.getByLabel("Estado de publicación").selectOption("published");
  await editor.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(editor.getByRole("alert")).toContainText("No se puede publicar"); await expect(editor.getByRole("alert")).toBeFocused();
  await page.screenshot({ path: `${screenshots}/publicacion-denegada.png`, fullPage: true });
  await editor.getByLabel("Estado de publicación").selectOption("draft"); await editor.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await page.getByRole("button", { name: "Agregar precio", exact: true }).click();
  await page.getByLabel("Precio en soles").fill("15.90"); await page.getByLabel("Confirmado por el negocio").check(); await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados"); await page.getByRole("button", { name: "Volver al producto" }).click();
  await editor.getByLabel("Estado de publicación").selectOption("published"); await editor.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  const publicData = (await (await page.request.get("/api/catalog")).json()).data;
  expect(publicData.items.find((entry: { id: string }) => entry.id === item)?.prices[0].priceCents).toBe(1590);
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/editor-${width}.png`, fullPage: true });
  }
  await editor.getByLabel("Nombre", { exact: true }).focus(); await page.keyboard.press("Tab"); await expect(editor.getByLabel("Identificador de la URL")).toBeFocused();
  await page.setViewportSize({ width: 640, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("conflicto conserva entrada y respuesta perdida recupera recibo sin duplicación", async ({ page }) => {
  await page.getByRole("button", { name: "Editar Producto de prueba H4", exact: true }).click();
  const old = Number((await staffPool.query("select revision from public.catalog_items where id=$1", [item])).rows[0].revision);
  await actorQuery(manager, "select public.update_catalog_item($1,$2,'{\"availability\":\"sold_out\"}',$3)", [item, old, randomUUID()]);
  await page.getByLabel("Nombre", { exact: true }).fill("Edición antigua que se conserva"); await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("El registro cambió"); await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Edición antigua que se conserva");
  await page.screenshot({ path: `${screenshots}/conflicto.png`, fullPage: true });
  await page.getByRole("button", { name: "Descartar cambios y cargar versión actual" }).click(); await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Producto de prueba H4");
  await page.route("**/administracion/carta", async (route) => { await route.fetch(); await route.abort("failed"); }, { times: 1 });
  await page.getByLabel("Disponibilidad").selectOption("available"); await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos comprobar");
  const raw = await page.evaluate(() => sessionStorage.getItem("fyb.catalog-operations.v1"));
  expect(raw).not.toContain("Producto de prueba H4"); const operation = JSON.parse(raw ?? "{}").operationId;
  await page.getByRole("button", { name: "Comprobar resultado", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Resultado registrado");
  expect((await staffPool.query("select count(*)::int total from app_private.audit_entries where operation_id=$1", [operation])).rows[0].total).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("fyb.catalog-operations.v1"))).toBeNull();
});

test("handler real rechaza archivos falsos y límites; subida, asociación y limpieza controladas", async ({ page }) => {
  const endpoint = "/api/admin/catalog/images";
  const headers = { Origin: root };
  const invalid = await page.request.post(endpoint, { headers, multipart: { itemId: item, uploadId: randomUUID(), file: { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("no es una imagen") } } }); expect(invalid.status()).toBe(400);
  const huge = await page.request.post(endpoint, { headers, multipart: { itemId: item, uploadId: randomUUID(), file: { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(4 * 1024 * 1024 + 1) } } }); expect(huge.status()).toBe(413);
  expect(huge.headers()["cache-control"]).toContain("no-store");
  const foreign = await page.request.post(endpoint, { headers: { Origin: "https://example.test" }, multipart: { itemId: item, uploadId: randomUUID(), file: { name: "test.png", mimeType: "image/png", buffer: photo } } }); expect(foreign.status()).toBe(403);
  await page.getByRole("button", { name: "Editar Producto de prueba H4", exact: true }).click();
  await page.getByLabel("Seleccionar fotografía").setInputFiles({ name: "abstract-test.png", mimeType: "image/png", buffer: photo }); await page.getByLabel("La fotografía corresponde al producto y su uso está autorizado").check();
  await page.getByRole("button", { name: "Subir fotografía", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Foto subida");
  const ref = JSON.parse(await page.evaluate(() => sessionStorage.getItem("fyb.catalog-media.v1")) ?? "{}"); paths.push(ref.imagePath);
  expect((await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0].image_path).toBeNull();
  await page.screenshot({ path: `${screenshots}/foto-subida.png`, fullPage: true });
  await page.getByRole("button", { name: "Asociar foto al producto", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Foto asociada");
  expect((await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0].image_path).toBe(ref.imagePath);
  const protectedCleanup = await page.request.delete(endpoint, { headers, data: { imagePath: ref.imagePath, operationId: randomUUID() } }); expect(protectedCleanup.status()).toBe(409);
  const orphanPath = `items/${item}/${randomUUID()}.png`; const uploaded = await page.request.post(endpoint, { headers, multipart: { itemId: item, uploadId: orphanPath.split("/")[2].split(".")[0], file: { name: "orphan.png", mimeType: "image/png", buffer: photo } } }); expect(uploaded.status()).toBe(200);
  const operationId = randomUUID(); const cleaned = await page.request.delete(endpoint, { headers, data: { imagePath: orphanPath, operationId } }); expect(cleaned.status()).toBe(200);
  expect((await page.request.delete(endpoint, { headers, data: { imagePath: orphanPath, operationId } })).status()).toBe(200);
  expect((await (await page.request.get(`${endpoint}?imagePath=${encodeURIComponent(orphanPath)}`)).json()).data.exists).toBe(false);
});

test("retirar y restaurar conserva UUID, imagen y precio sin reactivar publicación", async ({ page }) => {
  await page.getByRole("button", { name: "Editar Producto de prueba H4", exact: true }).click(); await page.getByLabel("Motivo de la acción").fill("Retiro sintético para revisión"); await page.getByRole("button", { name: "Confirmar retiro", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Registro retirado"); await page.screenshot({ path: `${screenshots}/retirado.png`, fullPage: true });
  const before = (await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0];
  const refused = await page.request.delete("/api/admin/catalog/images", { headers: { Origin: root }, data: { imagePath: before.image_path, operationId: randomUUID() } }); expect(refused.status()).toBe(409);
  await page.getByLabel("Motivo de la acción").fill("Restauración sintética para revisión"); await page.getByRole("button", { name: "Confirmar restauración", exact: true }).click(); await expect(page.getByRole("status")).toContainText("sin reactivación automática");
  await expect(page.getByLabel("Estado de publicación")).toHaveValue("draft"); await expect(page.getByLabel("Habilitado para la web")).not.toBeChecked(); await expect(page.getByLabel("Confirmo la porción y las inclusiones")).not.toBeChecked();
  expect((await staffPool.query("select verified from public.catalog_prices where item_id=$1", [item])).rows[0].verified).toBe(false);
  expect((await (await page.request.get("/api/catalog")).json()).data.items.some((entry: { id: string }) => entry.id === item)).toBe(false);
  await page.screenshot({ path: `${screenshots}/restaurado.png`, fullPage: true });
});
