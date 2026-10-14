import { randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, privateCardQuery, readPrivateCard } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";
import type { JwtTestActor, StaffFixture } from "./types/staff-fixture";

const programId = testProgramId;
let manager: StaffFixture, attendant: StaffFixture, other: StaffFixture;
let first: PrivateCustomerFixture, second: PrivateCustomerFixture;
let settings: Record<string, unknown>, program: Record<string, unknown>;
const customerIds: string[] = [];
const untrustedActor: JwtTestActor = { userId: randomUUID(), aal: "aal1" };
async function newCustomer(activate = true): Promise<PrivateCustomerFixture> {
  const customer = await createPrivateCustomerFixture(activate);
  if (activate) customerIds.push(customer.customerId);
  return customer;
}
async function credit(customer: PrivateCustomerFixture, operationId = randomUUID(), reference: string | null = null) {
  return (await actorQuery(attendant, "select public.credit_stamp($1,$2,true,true,$3) data", [customer.customerId, operationId, reference])).rows[0].data;
}
async function card(customer: PrivateCustomerFixture) {
  return readPrivateCard(customer);
}
async function availability(available: boolean) {
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [programId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,$3,$4)", [programId, revision, available, randomUUID()]);
}
beforeAll(async () => {
  manager = await createStaffFixture("manager");
  attendant = await createStaffFixture("attendant", manager.staffId ?? undefined);
  other = await createStaffFixture("attendant", manager.staffId ?? undefined);
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [programId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,$3,$4,$5)", [programId, program.revision, "fyb-loyalty-v1", JSON.stringify(testLaunchChecks), randomUUID()]);
  await availability(true);
  first = await newCustomer(); second = await newCustomer();
});
afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, customerIds);
  await cleanupStaffFixtures([manager, attendant, other]); await staffPool.end();
});
describe("H6 integridad, identidad y concurrencia reales en PostgreSQL local", () => {
  it("alta simultánea conserva una identidad, una tarjeta y cero sellos", async () => {
    const fresh = await newCustomer(false);
    const results = await Promise.all([1, 2].map(() => privateCardQuery("select public.ensure_card_by_key($1,'Alta simultánea',$2,'fyb-loyalty-v1',true) data", [fresh.keyHash, fresh.phone])));
    const response = results[0].rows[0].data;
    const original = await readPrivateCard(fresh);
    customerIds.push(original.customerId);
    expect(results[1].rows[0].data).toEqual(response);
    expect(original.netStamps).toBe(0);
  });
  it("términos antiguos o confirmación ausente no crean un perfil parcial", async () => {
    const fresh = await newCustomer(false);
    await expect(privateCardQuery("select public.ensure_card_by_key($1,'Cliente',$2,'old',true)", [fresh.keyHash, fresh.phone])).rejects.toMatchObject({ message: "TERMS_CHANGED" });
    await expect(privateCardQuery("select public.ensure_card_by_key($1,'Cliente',$2,'fyb-loyalty-v1',false)", [fresh.keyHash, fresh.phone])).rejects.toMatchObject({ message: "TERMS_CHANGED" });
    expect((await staffPool.query("select count(*)::int n from app_private.customers where access_key_hash=$1", [fresh.keyHash])).rows[0].n).toBe(0);
  });
  it("cliente no ejecuta sello/búsqueda ni CRUD; personal autorizado accede con contraseña", async () => {
    await expect(actorQuery(untrustedActor, "select public.credit_stamp($1,$2,true,true)", [first.customerId, randomUUID()])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(actorQuery(untrustedActor, "select public.lookup_customer($1)", [second.phone])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(actorQuery(untrustedActor, "select * from app_private.customers")).rejects.toMatchObject({ code: "42501" });
    expect((await actorQuery(attendant, "select public.get_staff_customer($1) data", [first.customerId])).rows[0].data).toBeTruthy();
  });
  it("ni pago sin entrega ni entrega sin pago suman sello o recibo", async () => {
    for (const confirmations of [[true, false], [false, true], [true, null]]) {
      const operation = randomUUID();
      await expect(actorQuery(attendant, "select public.credit_stamp($1,$2,$3,$4)", [first.customerId, operation, ...confirmations])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
      expect((await actorQuery(attendant, "select public.get_operation($1) data", [operation])).rows[0].data.status).toBe("not_found");
    }
    expect((await card(first)).netStamps).toBe(0);
  });
  it("9/10/11 y 20 sellos producen premios independientes", async () => {
    for (let i = 0; i < 9; i++) await credit(first);
    expect(await card(first)).toMatchObject({ progress: 9, netStamps: 9, availableRewards: [] });
    expect((await credit(first)).card).toMatchObject({ progress: 0, netStamps: 10 });
    expect((await credit(first)).card).toMatchObject({ progress: 1, netStamps: 11 });
    for (let i = 11; i < 20; i++) await credit(first);
    expect((await card(first)).availableRewards).toHaveLength(2);
    const sum = (await staffPool.query("select sum(stamp_delta)::int n from app_private.loyalty_events where card_id=$1", [first.cardId])).rows[0].n;
    expect(sum).toBe(20);
  });
  it("reintento concurrente tiene un efecto y entrada distinta se rechaza", async () => {
    const operation = randomUUID();
    const results = await Promise.all([credit(second, operation, "VISITA-1"), credit(second, operation, " VISITA-1 ")]);
    expect(results.map((r) => r.replayed).sort()).toEqual([false, true]);
    expect((await card(second)).netStamps).toBe(1);
    await expect(credit(second, operation, "VISITA-2")).rejects.toMatchObject({ message: "IDEMPOTENCY_CONFLICT" });
    await expect(credit(second, randomUUID(), "VISITA-1")).rejects.toMatchObject({ message: "DUPLICATE_VISIT_REFERENCE" });
  });
  it("dos visitas distintas concurrentes se acumulan en conexiones separadas", async () => {
    await Promise.all([credit(second), credit(second)]);
    expect((await card(second)).netStamps).toBe(3);
  });
  it("agotamiento y confirmación de visita ausente preservan el derecho", async () => {
    const reward = (await card(first)).availableRewards[0].id;
    await availability(false);
    await expect(actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [first.customerId, reward, randomUUID()])).rejects.toMatchObject({ message: "REWARD_UNAVAILABLE" });
    await availability(true);
    await expect(actorQuery(attendant, "select public.redeem_reward($1,$2,$3,false,true)", [first.customerId, reward, randomUUID()])).rejects.toMatchObject({ message: "LATER_VISIT_REQUIRED" });
    expect((await card(first)).availableRewards).toHaveLength(2);
  });
  it("dos empleados canjean solo una vez, sin compra ni cambio de progreso", async () => {
    const reward = (await card(first)).availableRewards[0].id;
    const results = await Promise.allSettled([attendant, other].map((actor) => actorQuery(actor, "select public.redeem_reward($1,$2,$3,true,true) data", [first.customerId, reward, randomUUID()])));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({ reason: { message: "REWARD_ALREADY_REDEEMED" } });
    expect(await card(first)).toMatchObject({ netStamps: 20, progress: 0 });
    expect((await card(first)).availableRewards).toHaveLength(1);
    expect((await staffPool.query("select reward_cost_cents_snapshot cost from app_private.loyalty_events where reward_id=$1 and event_type='reward_redeemed'", [reward])).rows[0].cost).toBe(650);
  });
  it("incidencia de entrega fallida no restituye premio y funciona con programa pausado", async () => {
    const reward = (await staffPool.query("select id from app_private.loyalty_rewards where card_id=$1 and status='redeemed'", [first.cardId])).rows[0].id;
    await staffPool.query("update public.business_settings set loyalty_enabled=false where id=1");
    await expect(credit(first)).rejects.toMatchObject({ message: "LOYALTY_PAUSED" });
    const operation = randomUUID();
    const result = (await actorQuery(attendant, "select public.open_incident($1,'reward_delivery_failed',$2,$3,$4) data", [first.customerId, "No se pudo entregar el premio registrado.", operation, reward])).rows[0].data;
    expect(result.incidentId).toBeTruthy(); expect(result.card.programEnabled).toBe(false);
    expect((await card(first)).availableRewards).toHaveLength(1);
    expect((await actorQuery(attendant, "select public.get_operation($1) data", [operation])).rows[0].data).toMatchObject({ status: "recorded", operationKind: "open_incident" });
    await staffPool.query("update public.business_settings set loyalty_enabled=true where id=1");
  });
  it("ficha propia no filtra teléfonos, actores, referencias ni costos; perfil versionado", async () => {
    const raw = (await privateCardQuery("select public.get_card_by_key($1) data", [second.keyHash])).rows[0].data;
    const projection = await card(second);
    expect(raw).not.toHaveProperty("phone");
    expect(raw).not.toHaveProperty("recentEvents.0.id");
    expect(raw).not.toHaveProperty("recentEvents.0.operationId");
    expect(JSON.stringify(raw)).not.toContain("VISITA-1");
    expect(JSON.stringify(raw)).not.toContain(second.keyHash);
    await privateCardQuery("select public.update_card_profile_by_key($1,$2,$3,$4)", [second.keyHash, "Nombre nuevo", "Sin ají", projection.profileRevision]);
    await expect(privateCardQuery("select public.update_card_profile_by_key($1,'Antiguo','',$2)", [second.keyHash, projection.profileRevision])).rejects.toMatchObject({ message: "CONFLICT" });
    expect((await card(second)).frequentInstructions).toBe("Sin ají");
    const audit = (await staffPool.query("select changed_fields from app_private.audit_entries where actor_user_id=$1", [second.customerId])).rows;
    expect(JSON.stringify(audit)).not.toContain("Sin ají");
  });
  it("búsqueda exacta usa el contacto declarado actual, sin autenticar al cliente", async () => {
    expect((await actorQuery(attendant, "select public.lookup_customer($1) data", [second.phone])).rows[0].data.found).toBe(true);
    await expect(actorQuery(attendant, "select public.lookup_customer('999')")).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    const old = second.phone; const next = "+519" + randomInt(10000000, 99999999);
    await privateCardQuery("select public.update_card_phone_by_key($1,$2,$3)", [second.keyHash, next, (await card(second)).profileRevision]);
    expect((await actorQuery(attendant, "select public.lookup_customer($1) data", [old])).rows[0].data.found).toBe(false);
    expect((await actorQuery(attendant, "select public.lookup_customer($1) data", [next])).rows[0].data.card.cardId).toBe(second.cardId);
  });
  it("cliente sin perfil y perfil cerrado se distinguen; no se recrea identidad", async () => {
    const fresh = await newCustomer(false);
    await expect(card(fresh)).rejects.toMatchObject({ message: "AUTH_REQUIRED" });
    await staffPool.query("update app_private.customers set status='closed' where id=$1", [second.customerId]);
    await expect(card(second)).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
    await expect(privateCardQuery("select public.ensure_card_by_key($1,'Cliente',$2,'fyb-loyalty-v1',true)", [second.keyHash, second.phone])).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
    await staffPool.query("update app_private.customers set status='active' where id=$1", [second.customerId]);
  });
  it("suspensión permite consulta; permiso actual impide replay al desactivar", async () => {
    const result = await credit(second);
    await staffPool.query("update app_private.loyalty_cards set status='suspended' where id=$1", [second.cardId]);
    expect((await card(second)).cardStatus).toBe("suspended");
    await expect(credit(second)).rejects.toMatchObject({ message: "CARD_UNAVAILABLE" });
    await staffPool.query("update app_private.loyalty_cards set status='active' where id=$1", [second.cardId]);
    await staffPool.query("update app_private.staff_accounts set active=false where id=$1", [attendant.staffId]);
    await expect(actorQuery(attendant, "select public.get_operation($1)", [result.operationId])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await staffPool.query("update app_private.staff_accounts set active=true where id=$1", [attendant.staffId]);
    expect((await actorQuery(other, "select public.get_operation($1) data", [result.operationId])).rows[0].data.status).toBe("not_found");
  });
  it("contador e historial no pueden divergir al confirmar una transacción", async () => {
    const previous = (await card(first)).netStamps;
    await expect(staffPool.query("update app_private.loyalty_cards set net_stamps=net_stamps+1 where id=$1", [first.cardId])).rejects.toMatchObject({ message: "CONFLICT" });
    expect((await card(first)).netStamps).toBe(previous);
    await expect(staffPool.query("update app_private.loyalty_events set stamp_delta=0 where card_id=$1", [first.cardId])).rejects.toThrow();
  });
  it("versión utilizada y premio canjeado conservan derechos y no se ocultan", async () => {
    await expect(staffPool.query("update app_private.loyalty_program_versions set reward_name='Otro premio' where id=$1", [programId])).rejects.toMatchObject({ message: "CONFLICT" });
    await expect(staffPool.query("update app_private.loyalty_program_versions set deleted_at=now(),deleted_by=$1,delete_reason='Eliminar versión utilizada' where id=$2", [manager.staffId, programId])).rejects.toMatchObject({ message: "CONFLICT" });
    await expect(staffPool.query("update app_private.loyalty_rewards set status='voided',deleted_at=now(),deleted_by=$1,delete_reason='Ocultar un premio canjeado' where card_id=$2 and status='redeemed'", [manager.staffId, first.cardId])).rejects.toMatchObject({ message: "CONFLICT" });
    await expect(staffPool.query("update app_private.loyalty_incidents set deleted_at=now(),deleted_by=$1,delete_reason='Ocultar incidencia abierta' where card_id=$2", [manager.staffId, first.cardId])).rejects.toMatchObject({ code: "23514" });
  });
  it("retirar y restaurar un perfil no libera su identidad ni reactiva acceso", async () => {
    const fresh = await newCustomer();
    await staffPool.query("update app_private.customers set status='closed',deleted_at=now(),deleted_by=$1,delete_reason='Retiro sintético supervisado' where id=$2", [manager.staffId, fresh.customerId]);
    await expect(privateCardQuery("select public.ensure_card_by_key($1,'Cliente',$2,'fyb-loyalty-v1',true)", [fresh.keyHash, fresh.phone])).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
    await staffPool.query("update app_private.customers set deleted_at=null,deleted_by=null,delete_reason=null,status='active' where id=$1", [fresh.customerId]);
    expect((await staffPool.query("select status from app_private.customers where id=$1", [fresh.customerId])).rows[0].status).toBe("closed");
    await expect(card(fresh)).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
  });
  it("costo nuevo no modifica canjes anteriores; personal común no lo edita", async () => {
    const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [programId])).rows[0].revision;
    await expect(actorQuery(attendant, "select public.update_reward_cost($1,$2,700,$3)", [programId, revision, randomUUID()])).rejects.toMatchObject({ message: "FORBIDDEN" });
    const operation = randomUUID();
    await actorQuery(manager, "select public.update_reward_cost($1,$2,700,$3)", [programId, revision, operation]);
    await expect(actorQuery(manager, "select public.update_reward_cost($1,$2,800,$3)", [programId, revision, operation])).rejects.toMatchObject({ message: "IDEMPOTENCY_CONFLICT" });
    const reward = (await card(first)).availableRewards[0].id;
    await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [first.customerId, reward, randomUUID()]);
    const costs = (await staffPool.query("select reward_cost_cents_snapshot n from app_private.loyalty_events where card_id=$1 and event_type='reward_redeemed' order by recorded_at", [first.cardId])).rows.map((row) => row.n);
    expect(costs).toEqual([650, 700]); expect((await card(first)).netStamps).toBe(20);
  });
});
