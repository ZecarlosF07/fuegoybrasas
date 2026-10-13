import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, readPrivateCard } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";
import type { StaffFixture } from "./types/staff-fixture";

import { customerListSchema, dashboardSchema, historySchema, incidentsSchema } from "@/features/management/validation/dto";

let manager: StaffFixture, attendant: StaffFixture, otherManager: StaffFixture;
let settings: Record<string, unknown>, program: Record<string, unknown>;
const customers: string[] = [];
async function customer(stamps = 0) {
  const value = await createPrivateCustomerFixture(); customers.push(value.customerId);
  for (let index = 0; index < stamps; index += 1) await actorQuery(attendant, "select public.credit_stamp($1,$2,true,true)", [value.customerId, randomUUID()]);
  return value;
}
async function original(value: PrivateCustomerFixture) {
  return (await staffPool.query("select id from app_private.loyalty_events where card_id=$1 and event_type='stamp_credited' order by recorded_at desc,id desc limit 1", [value.cardId])).rows[0].id;
}
async function reverse(value: PrivateCustomerFixture, id: string, operation = randomUUID(), actor = manager) {
  return (await actorQuery(actor, "select public.reverse_stamp($1,$2,'Compra acreditada por error',$3) data", [value.customerId, id, operation])).rows[0].data;
}
beforeAll(async () => {
  manager = await createStaffFixture("manager"); attendant = await createStaffFixture("attendant"); otherManager = await createStaffFixture("manager");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,'fyb-loyalty-v1',$3,$4)", [testProgramId, program.revision, JSON.stringify(testLaunchChecks), randomUUID()]);
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
});
afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, customers);
  await cleanupStaffFixtures([manager, attendant, otherManager]); await staffPool.end();
});
describe("H7 administración real y transacciones locales", () => {
  it("revierte 10→9 y una nueva visita restaura el mismo premio oculto", async () => {
    const value = await customer(10); const id = await original(value);
    const reward = (await readPrivateCard(value)).availableRewards[0];
    const operation = randomUUID(); const result = await reverse(value, id, operation);
    expect(result.card.netStamps).toBe(9); expect(result.card.availableRewards).toHaveLength(0);
    expect((await reverse(value, id, operation)).replayed).toBe(true);
    const revision = (await staffPool.query("select revision from app_private.loyalty_rewards where id=$1", [reward.id])).rows[0].revision;
    await actorQuery(manager, "select public.soft_delete_entity('loyalty_reward',$1,$2,'Ocultar premio anulado',$3)", [reward.id, revision, randomUUID()]);
    await actorQuery(attendant, "select public.credit_stamp($1,$2,true,true)", [value.customerId, randomUUID()]);
    expect((await readPrivateCard(value)).availableRewards[0].id).toBe(reward.id);
    expect((await staffPool.query("select count(*)::int total from app_private.loyalty_rewards where card_id=$1", [value.cardId])).rows[0].total).toBe(1);
    expect((await staffPool.query("select count(*)::int total from app_private.loyalty_events where card_id=$1 and event_type='reward_restored'", [value.cardId])).rows[0].total).toBe(1);
  });
  it("dos responsables no revierten el mismo sello dos veces", async () => {
    const value = await customer(2); const id = await original(value);
    const results = await Promise.allSettled([reverse(value, id), reverse(value, id, randomUUID(), otherManager)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await readPrivateCard(value)).netStamps).toBe(1);
  });
  it("premio canjeado exige revisión, conserva saldo y no duplica la incidencia", async () => {
    const value = await customer(10); const reward = (await readPrivateCard(value)).availableRewards[0];
    await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, reward.id, randomUUID()]);
    const id = await original(value); const operation = randomUUID();
    const first = await reverse(value, id, operation);
    expect(first.outcome).toBe("review_required"); expect(first.card.netStamps).toBe(10);
    expect((await reverse(value, id, operation)).incidentId).toBe(first.incidentId);
    expect((await reverse(value, id, randomUUID())).incidentId).toBe(first.incidentId);
    expect((await staffPool.query("select count(*)::int total from app_private.loyalty_incidents where card_id=$1", [value.cardId])).rows[0].total).toBe(1);
    const receipt = (await actorQuery(manager, "select public.get_operation($1) data", [operation])).rows[0].data;
    expect(receipt.result.outcome).toBe("review_required");
  });
  it("rechaza evento ajeno, repetición con UUID distinto, motivo breve y mozo", async () => {
    const a = await customer(2); const b = await customer(1); const id = await original(a);
    await expect(reverse(b, id)).rejects.toThrow("NOT_FOUND");
    await expect(reverse(a, id, randomUUID(), attendant)).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.reverse_stamp($1,$2,'error',$3)", [a.customerId, id, randomUUID()])).rejects.toThrow("VALIDATION_ERROR");
    await reverse(a, id); await expect(reverse(a, id)).rejects.toThrow("CONFLICT");
  });
  it("historial paginado no acepta cursor de otra tarjeta ni expone claves", async () => {
    const value = await customer(4); const other = await customer(1);
    const page = historySchema.parse((await actorQuery(manager, "select public.get_customer_history($1,null,2) data", [value.customerId])).rows[0].data);
    expect(page.events).toHaveLength(2); expect(page.nextCursor).not.toBeNull();
    const next = historySchema.parse((await actorQuery(manager, "select public.get_customer_history($1,$2,2) data", [value.customerId, page.nextCursor])).rows[0].data);
    expect(new Set([...page.events, ...next.events].map((event) => event.id)).size).toBe(4);
    await expect(actorQuery(manager, "select public.get_customer_history($1,$2,2)", [other.customerId, page.nextCursor])).rejects.toThrow("VALIDATION_ERROR");
    expect(JSON.stringify(page)).not.toContain("access_key");
    await expect(actorQuery(attendant, "select public.get_customer_history($1)", [value.customerId])).rejects.toThrow("FORBIDDEN");
  });
  it("corrección requiere solicitud expresa y revisión; conserva contacto y saldo", async () => {
    const value = await customer(2); const before = await readPrivateCard(value); const operation = randomUUID();
    const values = [value.customerId, before.profileRevision, "Nombre corregido", "Ají aparte", true, "Corrección pedida en el local", operation];
    const result = (await actorQuery(manager, "select public.correct_customer_profile($1,$2,$3,$4,$5,$6,$7) data", values)).rows[0].data;
    expect(result.entityType).toBe("customer");
    expect((await actorQuery(manager, "select public.correct_customer_profile($1,$2,$3,$4,$5,$6,$7) data", values)).rows[0].data.replayed).toBe(true);
    const after = await readPrivateCard(value); expect(after.netStamps).toBe(2); expect(after.phoneMasked).toBe(before.phoneMasked); expect(after.displayName).toBe("Nombre corregido");
    await expect(actorQuery(manager, "select public.correct_customer_profile($1,$2,'Otro','',true,'Nueva solicitud de cambio',$3)", [value.customerId, before.profileRevision, randomUUID()])).rejects.toThrow("CONFLICT");
    await expect(actorQuery(manager, "select public.correct_customer_profile($1,$2,'Otro','',false,'Nueva solicitud de cambio',$3)", [value.customerId, after.profileRevision, randomUUID()])).rejects.toThrow("VALIDATION_ERROR");
    const audit = (await staffPool.query("select changed_fields from app_private.audit_entries where operation_id=$1", [operation])).rows[0].changed_fields;
    expect(JSON.stringify(audit)).not.toContain("Ají aparte"); expect(JSON.stringify(audit)).not.toContain("Nombre corregido");
  });
  it("cerrar incidencia no cambia saldo; retiro/restauración conservan closed", async () => {
    const value = await customer(1);
    const opened = (await actorQuery(attendant, "select public.open_incident($1,'other','Revisión administrativa de prueba',$2) data", [value.customerId, randomUUID()])).rows[0].data;
    await expect(actorQuery(manager, "select public.soft_delete_entity('loyalty_incident',$1,1,'Ocultar caso abierto',$2)", [opened.incidentId, randomUUID()])).rejects.toThrow("CONFLICT");
    await actorQuery(manager, "select public.close_incident($1,1,'Consulta resuelta sin ajuste de saldo',$2)", [opened.incidentId, randomUUID()]);
    await actorQuery(manager, "select public.soft_delete_entity('loyalty_incident',$1,2,'Archivar caso ya cerrado',$2)", [opened.incidentId, randomUUID()]);
    await actorQuery(manager, "select public.restore_entity('loyalty_incident',$1,3,'Volver a revisar el caso cerrado',$2)", [opened.incidentId, randomUUID()]);
    expect((await readPrivateCard(value)).netStamps).toBe(1);
    expect((await staffPool.query("select status,deleted_at,revision from app_private.loyalty_incidents where id=$1", [opened.incidentId])).rows[0]).toMatchObject({ status: "closed", deleted_at: null, revision: 4 });
  });
  it("listado y métricas separan ocho/nueve sellos de premios pendientes", async () => {
    const near = await customer(8); const ready = await customer(10);
    const page = customerListSchema.parse((await actorQuery(manager, "select public.get_admin_customers('near_reward') data")).rows[0].data);
    expect(page.customers.some((entry) => entry.id === near.customerId)).toBe(true);
    expect(page.customers.some((entry) => entry.id === ready.customerId)).toBe(false);
    const available = customerListSchema.parse((await actorQuery(manager, "select public.get_admin_customers('available_reward') data")).rows[0].data);
    expect(available.customers.some((entry) => entry.id === ready.customerId)).toBe(true);
    const metrics = dashboardSchema.parse((await actorQuery(manager, "select public.get_loyalty_dashboard(current_date-1,current_date+1) data")).rows[0].data);
    expect(metrics.nearReward).toBeGreaterThan(0); expect(metrics.availableRewards).toBeGreaterThan(0);
    await expect(actorQuery(attendant, "select public.get_loyalty_dashboard(current_date,current_date)")).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery({ ...manager, aal: "aal1" }, "select public.get_admin_customers()")).rejects.toThrow("MFA_REQUIRED");
    await expect(actorQuery(manager, "select public.get_admin_customers('all',null,500)")).rejects.toThrow("VALIDATION_ERROR");
    const incidents = incidentsSchema.parse((await actorQuery(manager, "select public.get_loyalty_incidents('all') data")).rows[0].data);
    expect(incidents.incidents.length).toBeGreaterThan(0);
  });
  it("bloquea bajas pendientes PT-11 y protege versión activa y premios", async () => {
    const value = await customer(10); const reward = (await readPrivateCard(value)).availableRewards[0];
    await expect(actorQuery(manager, "select public.soft_delete_entity('customer',$1,1,'Solicitud de baja sin política',$2)", [value.customerId, randomUUID()])).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.soft_delete_entity('loyalty_reward',$1,1,'Retirar premio aún disponible',$2)", [reward.id, randomUUID()])).rejects.toThrow("CONFLICT");
    const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
    await expect(actorQuery(manager, "select public.soft_delete_entity('loyalty_program',$1,$2,'Eliminar versión ya utilizada',$3)", [testProgramId, revision, randomUUID()])).rejects.toThrow("CONFLICT");
  });
  it("correcciones funcionan con programa pausado y saldo reconcilia eventos", async () => {
    const value = await customer(2); const id = await original(value);
    await staffPool.query("update public.business_settings set loyalty_enabled=false where id=1");
    await reverse(value, id);
    expect((await readPrivateCard(value)).netStamps).toBe(1);
    const rows = await staffPool.query("select c.id from app_private.loyalty_cards c where c.net_stamps<>(select coalesce(sum(e.stamp_delta),0) from app_private.loyalty_events e where e.card_id=c.id)");
    expect(rows.rowCount).toBe(0);
    await staffPool.query("update public.business_settings set loyalty_enabled=true where id=1");
  });
});
