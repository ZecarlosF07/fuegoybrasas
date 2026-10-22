import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";
import { configSchema } from "@/features/business-config/validation/schemas";
import { catalogSchema } from "@/features/catalog/validation/schemas";

let manager: StaffFixture, attendant: StaffFixture;
let original: Record<string, unknown>;
const payment = randomUUID(), zone = randomUUID();
const code = `h5-${payment}`;
beforeAll(async () => {
  manager = await createStaffFixture("manager"); attendant = await createStaffFixture("attendant", manager.staffId ?? undefined);
  original = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
});
afterAll(async () => {
  if (original) await staffPool.query("update public.business_settings set ordering_enabled=false where id=1");
  const client = await staffPool.connect();
  try {
    await client.query("begin");
    for (const table of ["payment_methods", "delivery_zones"]) await client.query(`alter table public.${table} disable trigger catalog_no_delete`);
    await client.query("delete from public.payment_methods where id=$1", [payment]); await client.query("delete from public.delivery_zones where id=$1", [zone]);
    for (const table of ["payment_methods", "delivery_zones"]) await client.query(`alter table public.${table} enable trigger catalog_no_delete`);
    if (original) await client.query("update public.business_settings set ordering_enabled=$1,revision=$2,updated_at=$3 where id=1", [original.ordering_enabled, original.revision, original.updated_at]);
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  await cleanupStaffFixtures([manager, attendant]); await staffPool.end();
});
async function configRevision() { return Number((await staffPool.query("select revision from public.business_settings where id=1")).rows[0].revision); }
async function rowRevision(table: "payment_methods" | "delivery_zones", id: string) { return Number((await staffPool.query(`select revision from public.${table} where id=$1`, [id])).rows[0].revision); }
async function save(key: "paymentMethods" | "deliveryZones", id: string, revision: number, fields: object, operation = randomUUID(), globalRevision?: number) {
  return actorQuery(manager, "select public.update_business_config($1,$2,$3) data", [globalRevision ?? await configRevision(), JSON.stringify({ [key]: [{ id, expectedRevision: revision, fields }] }), operation]);
}
async function readCatalog() { return catalogSchema.parse((await staffPool.query("select public.read_catalog() data")).rows[0].data); }

describe("H5 configuración remota reproducible: pruebas locales aisladas", () => {
  it("manager con contraseña crea condiciones pendientes; atención y CRUD directo se deniegan", async () => {
    const patch = { paymentMethods: [{ id: payment, expectedRevision: 0, fields: { code, label: "Pago sintético H5" } }] };
    await expect(actorQuery(attendant, "select public.update_business_config($1,$2,$3)", [await configRevision(), JSON.stringify(patch), randomUUID()])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await save("paymentMethods", payment, 0, { code, label: "Pago sintético H5" });
    await save("deliveryZones", zone, 0, { name: "Zona sintética H5", coverage: "allowed" });
    expect((await readCatalog()).configuration.paymentMethods).toEqual([]);
    const privateConfig = configSchema.parse((await actorQuery(manager, "select public.get_admin_config() data")).rows[0].data);
    expect(privateConfig.paymentMethods.find((row) => row.id === payment)?.verified).toBe(false);
    await expect(actorQuery(manager, "select * from public.payment_methods")).rejects.toMatchObject({ code: "42501" });
  });
  it("verificación proyecta NULL y los cambios incrementan la revisión global", async () => {
    const revision = await configRevision();
    await save("paymentMethods", payment, await rowRevision("payment_methods", payment), { enabled: true, verified: true, needs_change: true });
    expect(await configRevision()).toBe(revision + 1);
    await save("deliveryZones", zone, await rowRevision("delivery_zones", zone), { enabled: true, verified: true });
    const snapshot = await readCatalog();
    expect(snapshot.configuration.paymentMethods[0]).toMatchObject({ code, needsChange: true });
    expect(snapshot.configuration.deliveryZones[0]).toMatchObject({ feeCents: null, minimumSubtotalCents: null });
  });
  it("reintentos simultáneos tienen un recibo/auditoría y payload diferente no se reinterpreta", async () => {
    const operation = randomUUID(), revision = await configRevision();
    const childRevision = await rowRevision("delivery_zones", zone);
    const fields = { fee_cents: 300, verified: true };
    const responses = await Promise.all([save("deliveryZones", zone, childRevision, fields, operation, revision), save("deliveryZones", zone, childRevision, fields, operation, revision)]);
    expect(responses.map((result) => result.rows[0].data.replayed).sort()).toEqual([false, true]);
    expect(await configRevision()).toBe(revision + 1);
    const counts = (await staffPool.query("select (select count(*)::int from app_private.operation_receipts where actor_user_id=$1 and operation_id=$2) receipts,(select count(*)::int from app_private.audit_entries where actor_user_id=$1 and operation_id=$2) audits", [manager.userId, operation])).rows[0];
    expect(counts).toEqual({ receipts: 1, audits: 1 });
    await expect(save("deliveryZones", zone, childRevision, { fee_cents: 400 }, operation, revision)).rejects.toMatchObject({ message: "IDEMPOTENCY_CONFLICT" });
    expect((await actorQuery(manager, "select public.get_operation($1) data", [operation])).rows[0].data.status).toBe("recorded");
    await expect(save("deliveryZones", zone, await rowRevision("delivery_zones", zone), { fee_cents: 400 }, randomUUID(), revision)).rejects.toMatchObject({ message: "CONFLICT" });
  });
  it("no-op conserva revisiones; código y entrada estricta protegen la identidad", async () => {
    const revision = await configRevision();
    await save("paymentMethods", payment, await rowRevision("payment_methods", payment), { needs_change: true });
    expect(await configRevision()).toBe(revision);
    await expect(save("paymentMethods", payment, await rowRevision("payment_methods", payment), { code: "otro" })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(save("deliveryZones", zone, await rowRevision("delivery_zones", zone), { fee_cents: "300" })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(save("deliveryZones", zone, await rowRevision("delivery_zones", zone), { deleted_at: "2026-01-01" })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(save("deliveryZones", zone, await rowRevision("delivery_zones", zone), { fee_cents: -1 })).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("activar WhatsApp y retirar pagos antiguos son independientes", async () => {
    await actorQuery(manager, "select public.update_business_config($1,'{\"orderingEnabled\":true}',$2)", [await configRevision(), randomUUID()]);
    expect((await readCatalog()).configuration.orderingEnabled).toBe(true);
    await save("paymentMethods", payment, await rowRevision("payment_methods", payment), { label: "Cambio sin confirmar" });
    expect((await readCatalog()).configuration.paymentsReady).toBe(false);
    expect((await readCatalog()).configuration.orderingEnabled).toBe(true);
    await actorQuery(manager, "select public.soft_delete_entity('payment_method',$1,$2,'Retiro sintético H5',$3)", [payment, await rowRevision("payment_methods", payment), randomUUID()]);
    await actorQuery(manager, "select public.restore_entity('payment_method',$1,$2,'Restauración sintética H5',$3)", [payment, await rowRevision("payment_methods", payment), randomUUID()]);
    await actorQuery(manager, "select public.update_business_config($1,'{\"orderingEnabled\":false}',$2)", [await configRevision(), randomUUID()]);
  });
  it("borrado/restauración conserva UUID y deja disabled/unverified con recibos consultables", async () => {
    const operation = randomUUID();
    await actorQuery(manager, "select public.soft_delete_entity('delivery_zone',$1,$2,'Retiro sintético H5',$3)", [zone, await rowRevision("delivery_zones", zone), operation]);
    expect((await readCatalog()).configuration.deliveryZones).toEqual([]);
    expect((await actorQuery(manager, "select public.get_operation($1) data", [operation])).rows[0].data.currentState).toMatchObject({ entity: "delivery_zone", deleted: true });
    await actorQuery(manager, "select public.restore_entity('delivery_zone',$1,$2,'Restauración sintética H5',$3)", [zone, await rowRevision("delivery_zones", zone), randomUUID()]);
    expect((await staffPool.query("select id,enabled,verified,deleted_at from public.delivery_zones where id=$1", [zone])).rows[0]).toEqual({ id: zone, enabled: false, verified: false, deleted_at: null });
    await actorQuery(manager, "select public.soft_delete_entity('payment_method',$1,$2,'Retiro sintético H5',$3)", [payment, await rowRevision("payment_methods", payment), randomUUID()]);
    await actorQuery(manager, "select public.restore_entity('payment_method',$1,$2,'Restauración sintética H5',$3)", [payment, await rowRevision("payment_methods", payment), randomUUID()]);
    expect((await staffPool.query("select enabled,verified from public.payment_methods where id=$1", [payment])).rows[0]).toEqual({ enabled: false, verified: false });
    await actorQuery(manager, "select public.update_business_config($1,'{\"orderingEnabled\":true}',$2)", [await configRevision(), randomUUID()]);
    expect((await readCatalog()).configuration.orderingEnabled).toBe(true);
    expect((await readCatalog()).configuration.paymentMethods).toEqual([]);
  });
});
