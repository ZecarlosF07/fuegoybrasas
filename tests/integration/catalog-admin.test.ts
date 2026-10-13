import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool, testAuthClient, totpCode } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";
import { adminCatalogSchema } from "@/features/catalog-admin/validation/schemas";

const identities: StaffFixture[] = [];
let manager: StaffFixture, other: StaffFixture, attendant: StaffFixture, outsider: StaffFixture;
let category: string, item: string, price: string, group: string, choice: string;
const items: string[] = [], categories: string[] = [];
beforeAll(async () => {
  manager = await createStaffFixture("manager"); identities.push(manager);
  other = await createStaffFixture("manager"); identities.push(other);
  attendant = await createStaffFixture("attendant"); identities.push(attendant);
  outsider = await createStaffFixture(null); identities.push(outsider);
});
beforeEach(async () => {
  category = randomUUID(); item = randomUUID(); price = randomUUID(); group = randomUUID(); choice = randomUUID();
  categories.push(category); items.push(item);
  await create("category", category, { name: "Categoría sintética H4", slug: `h4-${category}`, active: true });
  await create("catalog_item", item, { category_id: category, name: "Producto sintético H4", slug: `h4-${item}`, kind: "regular", portion_label: "Porción de prueba", inclusions: ["Inclusión sintética"] });
  await create("catalog_price", price, { item_id: item, mode: "delivery", price_cents: 1500 });
});
afterEach(async () => {
  const connection = await staffPool.connect();
  try {
    await connection.query("begin");
    for (const table of ["option_choices", "option_groups", "promotions", "catalog_prices", "catalog_items", "categories"]) await connection.query(`alter table public.${table} disable trigger catalog_no_delete`);
    await connection.query("delete from public.option_choices where group_id in(select id from public.option_groups where item_id=any($1::uuid[]))", [items]);
    for (const table of ["option_groups", "promotions", "catalog_prices"]) await connection.query(`delete from public.${table} where item_id=any($1::uuid[])`, [items]);
    await connection.query("delete from public.catalog_items where id=any($1::uuid[])", [items]);
    await connection.query("delete from public.categories where id=any($1::uuid[])", [categories]);
    for (const table of ["option_choices", "option_groups", "promotions", "catalog_prices", "catalog_items", "categories"]) await connection.query(`alter table public.${table} enable trigger catalog_no_delete`);
    await connection.query("commit");
  } catch (error) { await connection.query("rollback"); throw error; } finally { connection.release(); }
});
afterAll(async () => { await cleanupStaffFixtures(identities); await staffPool.end(); });
async function create(type: string, id: string, patch: object) { return actorQuery(manager, "select public.create_catalog_entity($1,$2,$3,$4) data", [type, id, JSON.stringify(patch), randomUUID()]); }
async function revision(table: string, id: string) { return Number((await staffPool.query(`select revision from public.${table} where ${table === "promotions" ? "item_id" : "id"}=$1`, [id])).rows[0].revision); }
async function updateItem(patch: object) { return actorQuery(manager, "select public.update_catalog_item($1,$2,$3,$4) data", [item, await revision("catalog_items", item), JSON.stringify(patch), randomUUID()]); }
async function publish() {
  await actorQuery(manager, "select public.update_catalog_price($1,$2,'{\"verified\":true}',$3)", [price, await revision("catalog_prices", price), randomUUID()]);
  await updateItem({ content_verified: true, online_enabled: true, publication_status: "published" });
}
async function visible() { const snapshot = (await staffPool.query("select public.read_catalog() data")).rows[0].data; return snapshot.items.find((entry: { id: string }) => entry.id === item); }
async function conserve(type: string, id: string, table: string, restoring = false, operation = randomUUID()) { return actorQuery(manager, `select public.${restoring ? "restore_entity" : "soft_delete_entity"}($1,$2,$3,$4,$5) data`, [type, id, await revision(table, id), "Motivo sintético de conservación", operation]); }

describe("H4 permisos, contratos estrechos y publicación", () => {
  it("solo responsable AAL2 obtiene una proyección privada válida y filtros de retirados", async () => {
    const data = (await actorQuery(manager, "select public.get_admin_catalog(true) data")).rows[0].data;
    expect(adminCatalogSchema.parse(data).items.some((entry) => entry.id === item)).toBe(true);
    for (const actor of [attendant, outsider, { ...manager, aal: "aal1" as const }]) await expect(actorQuery(actor, "select public.get_admin_catalog(true)")).rejects.toMatchObject({ message: actor === attendant ? "FORBIDDEN" : actor === outsider ? "FORBIDDEN" : "MFA_REQUIRED" });
    await conserve("catalog_item", item, "catalog_items");
    expect((await actorQuery(manager, "select public.get_admin_catalog(false) data")).rows[0].data.items.some((entry: { id: string }) => entry.id === item)).toBe(false);
  });
  it("anónimo y autenticado no tienen CRUD ni acceso a auxiliares privados", async () => {
    const privileges = (await staffPool.query("select has_function_privilege('anon','public.update_catalog_item(uuid,integer,jsonb,uuid)','execute') anon,has_table_privilege('authenticated','public.catalog_items','update') direct,has_schema_privilege('authenticated','app_private','usage') private")).rows[0];
    expect(privileges).toEqual({ anon: false, direct: false, private: false });
    await expect(actorQuery(attendant, "select public.update_catalog_item($1,1,'{\"availability\":\"sold_out\"}',$2)", [item, randomUUID()])).rejects.toMatchObject({ message: "FORBIDDEN" });
  });
  it("rechaza actor, revisión, source_ref, nombres de tabla y booleanos/arrays falsos en patch", async () => {
    for (const patch of [{ deleted_by: manager.staffId }, { revision: 999 }, { source_ref: "P05" }, { online_enabled: "true" }, { inclusions: [1] }]) await expect(updateItem(patch)).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(create("public.catalog_items", randomUUID(), { name: "No" })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("no publica con contenido, precio o categoría sin confirmar", async () => {
    await expect(updateItem({ online_enabled: true, publication_status: "published" })).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
    await publish(); expect(await visible()).toMatchObject({ name: "Producto sintético H4" });
    await actorQuery(manager, "select public.update_catalog_category($1,$2,'{\"active\":false}',$3)", [category, await revision("categories", category), randomUUID()]);
    expect(await visible()).toBeUndefined();
  });
  it("contenido editado invalida confirmación y comparación; confirmación expresa permite publicación", async () => {
    await publish();
    await expect(updateItem({ name: "Contenido sin confirmar" })).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
    await updateItem({ name: "Contenido confirmado", content_verified: true });
    expect(await visible()).toMatchObject({ name: "Contenido confirmado" });
  });
  it("C01 y P05 conservan restricciones de modalidad incluso por RPC directa", async () => {
    const seed = (await staffPool.query("select id,source_ref from public.catalog_items where source_ref in('C01','P05')")).rows;
    for (const row of seed) await expect(create("catalog_price", randomUUID(), { item_id: row.id, mode: "pickup", price_cents: 1, verified: true })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("un JWT real AAL1 no edita; el mismo usuario con TOTP obtiene AAL2", async () => {
    const client = testAuthClient();
    expect((await client.auth.signInWithPassword({ email: manager.email, password: manager.password })).error).toBeNull();
    expect((await client.rpc("get_admin_catalog", { p_include_deleted: true })).error?.message).toBe("MFA_REQUIRED");
    const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: `h4-${randomUUID()}` });
    if (enrolled.error || enrolled.data.type !== "totp") throw new Error("No se pudo preparar MFA sintético.");
    expect((await client.auth.mfa.challengeAndVerify({ factorId: enrolled.data.id, code: totpCode(enrolled.data.totp.secret) })).error).toBeNull();
    expect((await client.rpc("get_admin_catalog", { p_include_deleted: true })).error).toBeNull();
    await client.auth.signOut();
  });
});

describe("H4 concurrencia, dependencias y conservación", () => {
  it("dos reintentos producen un solo cambio, auditoría y recibo; get_operation recupera estado", async () => {
    const operation = randomUUID(); const old = await revision("catalog_items", item);
    const args = [item, old, '{"availability":"sold_out"}', operation];
    const results = await Promise.all([actorQuery(manager, "select public.update_catalog_item($1,$2,$3,$4) data", args), actorQuery(manager, "select public.update_catalog_item($1,$2,$3,$4) data", args)]);
    expect(results.map((result) => result.rows[0].data.replayed).sort()).toEqual([false, true]);
    expect(await revision("catalog_items", item)).toBe(old + 1);
    expect((await staffPool.query("select count(*)::int total from app_private.audit_entries where operation_id=$1", [operation])).rows[0].total).toBe(1);
    expect((await actorQuery(manager, "select public.get_operation($1) data", [operation])).rows[0].data).toMatchObject({ status: "recorded", currentState: { entity: "catalog_item", revision: old + 1 } });
    await expect(actorQuery(manager, "select public.update_catalog_item($1,$2,'{\"name\":\"Otra entrada\"}',$3)", [item, old, operation])).rejects.toMatchObject({ message: "IDEMPOTENCY_CONFLICT" });
  });
  it("un editor antiguo y una cuenta degradada no recuperan privilegios con replay", async () => {
    const operation = randomUUID(); const old = await revision("catalog_items", item);
    await actorQuery(other, "select public.update_catalog_item($1,$2,'{\"availability\":\"sold_out\"}',$3)", [item, old, operation]);
    await expect(actorQuery(manager, "select public.update_catalog_item($1,$2,'{\"name\":\"Antigua\"}',$3)", [item, old, randomUUID()])).rejects.toMatchObject({ message: "CONFLICT" });
    await staffPool.query("update app_private.staff_accounts set active=false where id=$1", [other.staffId]);
    await expect(actorQuery(other, "select public.get_operation($1)", [operation])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await staffPool.query("update app_private.staff_accounts set active=true where id=$1", [other.staffId]);
  });
  it("no-op genera solo recibo; hijos avanzan revisión e invalidan comparación", async () => {
    const operation = randomUUID(); const old = await revision("catalog_items", item);
    await actorQuery(manager, "select public.update_catalog_item($1,$2,'{\"availability\":\"available\"}',$3)", [item, old, operation]);
    expect(await revision("catalog_items", item)).toBe(old);
    expect((await staffPool.query("select count(*)::int total from app_private.audit_entries where operation_id=$1", [operation])).rows[0].total).toBe(0);
    await updateItem({ kind: "promotion", content_verified: true });
    await create("promotion", item, { enabled: true, starts_at: "2026-01-01T00:00:00Z", previous_price_cents: 2000, comparison_verified: true });
    const dateOperation = randomUUID(); const promoRevision = await revision("promotions", item);
    await actorQuery(manager, "select public.update_catalog_promotion($1,$2,'{\"starts_at\":\"2026-01-01T00:00:00.000Z\"}',$3)", [item, promoRevision, dateOperation]);
    expect(await revision("promotions", item)).toBe(promoRevision);
    expect((await staffPool.query("select count(*)::int total from app_private.audit_entries where operation_id=$1", [dateOperation])).rows[0].total).toBe(0);
    await publish();
    await actorQuery(manager, "select public.update_catalog_promotion($1,$2,'{\"comparison_verified\":true}',$3)", [item, await revision("promotions", item), randomUUID()]);
    const before = await revision("catalog_items", item);
    await actorQuery(manager, "select public.update_catalog_price($1,$2,'{\"price_cents\":1600,\"verified\":true}',$3)", [price, await revision("catalog_prices", price), randomUUID()]);
    expect(await revision("catalog_items", item)).toBeGreaterThan(before);
    expect((await visible()).promotion.previousPriceCents).toBeNull();
  });
  it("grupo obligatorio exige opciones válidas y no permite agotar la última", async () => {
    await create("option_group", group, { item_id: item, name: "Grupo", min_choices: 1, max_choices: 1, active: true, verified: true });
    await expect(publish()).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
    await create("option_choice", choice, { group_id: group, label: "Elección", available: true, verified: true });
    await publish();
    await expect(actorQuery(manager, "select public.update_catalog_option_choice($1,$2,'{\"available\":false}',$3)", [choice, await revision("option_choices", choice), randomUUID()])).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
    await updateItem({ availability: "sold_out" }); expect(await visible()).toMatchObject({ availability: "sold_out" });
  });
  it("retirar un padre conserva filas, razón, autor y unicidad; restaurar no publica su rama", async () => {
    await publish();
    await conserve("category", category, "categories"); expect(await visible()).toBeUndefined();
    expect((await staffPool.query("select deleted_by,delete_reason from public.categories where id=$1", [category])).rows[0]).toMatchObject({ deleted_by: manager.staffId, delete_reason: "Motivo sintético de conservación" });
    await expect(create("category", randomUUID(), { name: "Duplicada", slug: `h4-${category}` })).rejects.toMatchObject({ message: "CONFLICT" });
    await conserve("category", category, "categories", true);
    await actorQuery(manager, "select public.update_catalog_category($1,$2,'{\"active\":true}',$3)", [category, await revision("categories", category), randomUUID()]);
    expect(await visible()).toBeUndefined();
    expect((await staffPool.query("select publication_status,content_verified,online_enabled from public.catalog_items where id=$1", [item])).rows[0]).toEqual({ publication_status: "draft", content_verified: false, online_enabled: false });
  });
  it("restaurar item invalida precios y grupos; hijos de padre retirado no se restauran", async () => {
    await publish(); await conserve("catalog_item", item, "catalog_items");
    await conserve("catalog_price", price, "catalog_prices");
    await expect(conserve("catalog_price", price, "catalog_prices", true)).rejects.toMatchObject({ message: "CONFLICT" });
    await conserve("catalog_item", item, "catalog_items", true);
    await conserve("catalog_price", price, "catalog_prices", true);
    expect((await staffPool.query("select verified from public.catalog_prices where id=$1", [price])).rows[0].verified).toBe(false);
    expect(await visible()).toBeUndefined();
  });
  it("motivos cortos se rechazan y doble retiro/restauración con mismo UUID tiene un efecto", async () => {
    await expect(actorQuery(manager, "select public.soft_delete_entity('catalog_item',$1,$2,'corto',$3)", [item, await revision("catalog_items", item), randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    for (const restoring of [false, true]) {
      const operation = randomUUID(); const old = await revision("catalog_items", item);
      const sql = `select public.${restoring ? "restore_entity" : "soft_delete_entity"}('catalog_item',$1,$2,'Motivo sintético de conservación',$3) data`;
      const results = await Promise.all([actorQuery(manager, sql, [item, old, operation]), actorQuery(manager, sql, [item, old, operation])]);
      expect(results.map((result) => result.rows[0].data.replayed).sort()).toEqual([false, true]);
    }
  });
});
