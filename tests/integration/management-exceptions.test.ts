import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, readPrivateCard } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";
import type { StaffFixture } from "./types/staff-fixture";

let manager: StaffFixture, other: StaffFixture, attendant: StaffFixture;
let settings: Record<string, unknown>, program: Record<string, unknown>;
const ids: string[] = [];
async function customer(stamps = 0) {
  const value = await createPrivateCustomerFixture(); ids.push(value.customerId);
  for (let index = 0; index < stamps; index += 1) await actorQuery(attendant, "select public.credit_stamp($1,$2,true,true,$3)", [value.customerId, randomUUID(), "EX-VISITA-" + index]);
  return value;
}
async function failedPrize(value: PrivateCustomerFixture) {
  const reward = (await readPrivateCard(value)).availableRewards[0];
  await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, reward.id, randomUUID()]);
  const incident = (await actorQuery(attendant, "select public.open_incident($1,'reward_delivery_failed','Premio sintético no entregado',$2,$3) data", [value.customerId, randomUUID(), reward.id])).rows[0].data;
  return { reward, incidentId: incident.incidentId };
}
beforeAll(async () => {
  manager = await createStaffFixture("manager"); other = await createStaffFixture("manager"); attendant = await createStaffFixture("attendant");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,'fyb-loyalty-v1',$3,$4)", [testProgramId, program.revision, JSON.stringify(testLaunchChecks), randomUUID()]);
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
});
afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, ids);
  await cleanupStaffFixtures([manager, other, attendant]); await staffPool.end();
});
describe("H7 decisiones aprobadas de negocio", () => {
  it("restitución conserva canje original, saldo y UUID y permite un nuevo canje", async () => {
    const value = await customer(10); const failed = await failedPrize(value); const operation = randomUUID();
    const result = (await actorQuery(manager, "select public.reinstate_reward($1,1,true,'Confirmada la falta de entrega',$2) data", [failed.incidentId, operation])).rows[0].data;
    expect(result.card.netStamps).toBe(10); expect(result.card.availableRewards[0].id).toBe(failed.reward.id);
    expect((await actorQuery(manager, "select public.reinstate_reward($1,1,true,'Confirmada la falta de entrega',$2) data", [failed.incidentId, operation])).rows[0].data.replayed).toBe(true);
    const events = (await staffPool.query("select event_type,reinstates_event_id from app_private.loyalty_events where reward_id=$1 order by recorded_at,id", [failed.reward.id])).rows;
    expect(events.filter((event) => event.event_type === "reward_redeemed")).toHaveLength(1);
    expect(events.filter((event) => event.event_type === "reward_reinstated")).toHaveLength(1);
    await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, failed.reward.id, randomUUID()]);
    expect((await readPrivateCard(value)).availableRewards).toHaveLength(0);
  });
  it("dos responsables restituyen una sola vez y mozo/confirmación ausente fallan", async () => {
    const value = await customer(10); const failed = await failedPrize(value);
    await expect(actorQuery(attendant, "select public.reinstate_reward($1,1,true,'Confirmada la falta de entrega',$2)", [failed.incidentId, randomUUID()])).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.reinstate_reward($1,1,false,'Confirmada la falta de entrega',$2)", [failed.incidentId, randomUUID()])).rejects.toThrow("VALIDATION_ERROR");
    const results = await Promise.allSettled([manager, other].map((actor) => actorQuery(actor, "select public.reinstate_reward($1,1,true,'Confirmada la falta de entrega',$2)", [failed.incidentId, randomUUID()])));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await readPrivateCard(value)).availableRewards).toHaveLength(1);
  });
  it("incidencia antigua no restituye un canje posterior del mismo premio", async () => {
    const value = await customer(10); const failed = await failedPrize(value);
    const duplicate = (await actorQuery(attendant, "select public.open_incident($1,'reward_delivery_failed','Segundo reporte del mismo fallo',$2,$3) data", [value.customerId, randomUUID(), failed.reward.id])).rows[0].data;
    await actorQuery(manager, "select public.reinstate_reward($1,1,true,'Entrega original no realizada',$2)", [failed.incidentId, randomUUID()]);
    await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, failed.reward.id, randomUUID()]);
    await expect(actorQuery(manager, "select public.reinstate_reward($1,1,true,'No usar el caso antiguo para otro canje',$2)", [duplicate.incidentId, randomUUID()])).rejects.toThrow("CONFLICT");
    expect((await readPrivateCard(value)).availableRewards).toHaveLength(0);
  });
  it("recuperación requiere presencia, referencia e historial; invalida clave antigua", async () => {
    const value = await customer(2); const before = await readPrivateCard(value);
    const event = (await staffPool.query("select id,visit_reference from app_private.loyalty_events where card_id=$1 and event_type='stamp_credited' order by recorded_at,id limit 1", [value.cardId])).rows[0];
    const hash = createHash("sha256").update(randomBytes(32)).digest("hex"); const operation = randomUUID();
    const args = [value.customerId, before.profileRevision, hash, event.visit_reference, event.id, true, true, "Titular verificado presencialmente", operation];
    await actorQuery(manager, "select public.recover_card_access($1,$2,$3,$4,$5,$6,$7,$8,$9)", args);
    expect((await actorQuery(manager, "select public.recover_card_access($1,$2,$3,$4,$5,$6,$7,$8,$9) data", args)).rows[0].data.replayed).toBe(true);
    await expect(readPrivateCard(value)).rejects.toThrow("AUTH_REQUIRED");
    const fresh = await readPrivateCard({ ...value, keyHash: hash }); expect(fresh.cardId).toBe(before.cardId); expect(fresh.netStamps).toBe(2);
    await expect(actorQuery(attendant, "select public.recover_card_access($1,$2,$3,$4,$5,$6,$7,$8,$9)", args)).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.recover_card_access($1,$2,$3,$4,$5,$6,$7,$8,$9)", [...args.slice(0, 5), false, true, args[7], randomUUID()])).rejects.toThrow("VALIDATION_ERROR");
    const stored = (await staffPool.query("select outcome from app_private.operation_receipts where operation_id=$1", [operation])).rows[0].outcome;
    expect(JSON.stringify(stored)).not.toContain(hash);
  });
  it("incidencias de una misma transacción conservan el canje exacto y no restituyen el siguiente", async () => {
    const value = await customer(10); const reward = (await readPrivateCard(value)).availableRewards[0];
    const connection = await staffPool.connect();
    try {
      await connection.query("begin");
      await connection.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: manager.userId, role: "authenticated", aal: "aal2" })]);
      await connection.query("set local role authenticated");
      await connection.query("select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, reward.id, randomUUID()]);
      const first = (await connection.query("select public.open_incident($1,'reward_delivery_failed','Entrega inicial sintética no realizada',$2,$3) data", [value.customerId, randomUUID(), reward.id])).rows[0].data;
      const duplicate = (await connection.query("select public.open_incident($1,'reward_delivery_failed','Segundo reporte de la entrega inicial',$2,$3) data", [value.customerId, randomUUID(), reward.id])).rows[0].data;
      await connection.query("select public.reinstate_reward($1,1,true,'Confirmada falta de entrega original',$2)", [first.incidentId, randomUUID()]);
      await connection.query("select public.redeem_reward($1,$2,$3,true,true)", [value.customerId, reward.id, randomUUID()]);
      await connection.query("savepoint old_incident");
      await expect(connection.query("select public.reinstate_reward($1,1,true,'Caso antiguo no cubre segundo canje',$2)", [duplicate.incidentId, randomUUID()])).rejects.toThrow("CONFLICT");
      await connection.query("rollback to savepoint old_incident");
      await connection.query("commit");
      const incident = (await staffPool.query("select source_event_id,created_at from app_private.loyalty_incidents where id=$1", [duplicate.incidentId])).rows[0];
      const restored = (await staffPool.query("select reinstates_event_id from app_private.loyalty_events where card_id=$1 and event_type='reward_reinstated'", [value.cardId])).rows[0];
      expect(incident.source_event_id).toBe(restored.reinstates_event_id);
      expect((await readPrivateCard(value)).availableRewards).toHaveLength(0);
    } catch (error) { await connection.query("rollback"); throw error; }
    finally { connection.release(); }
  });
  it("contingencia conserva fecha de entrega y referencia; rechaza futuro y mozo", async () => {
    const value = await customer();
    const when = new Date().toISOString(); const operation = randomUUID();
    await actorQuery(manager, "select public.credit_contingency_stamp($1,$2,'CAIDA-UNICA','Compra pagada y entregada durante caída',true,true,$3)", [value.customerId, when, operation]);
    expect((await actorQuery(manager, "select public.credit_contingency_stamp($1,$2,'CAIDA-UNICA','Compra pagada y entregada durante caída',true,true,$3) data", [value.customerId, when, operation])).rows[0].data.replayed).toBe(true);
    await expect(actorQuery(manager, "select public.credit_contingency_stamp($1,$2,'CAIDA-UNICA','Compra pagada y entregada durante caída',true,true,$3)", [value.customerId, when, randomUUID()])).rejects.toThrow("DUPLICATE_VISIT_REFERENCE");
    await expect(actorQuery(attendant, "select public.credit_contingency_stamp($1,$2,'CAIDA-OTRA','Compra pagada y entregada durante caída',true,true,$3)", [value.customerId, when, randomUUID()])).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.credit_contingency_stamp($1,now()+interval '1 day','FUTURO','Compra futura no permitida',true,true,$2)", [value.customerId, randomUUID()])).rejects.toThrow("VALIDATION_ERROR");
    // PostgreSQL conserva microsegundos; Date de JavaScript los trunca y podía igualar ambas fechas en CI.
    const event = (await staffPool.query("select occurred_at,recorded_at>occurred_at as recorded_later from app_private.loyalty_events where card_id=$1", [value.cardId])).rows[0];
    expect(new Date(event.occurred_at).toISOString()).toBe(when); expect(event.recorded_later).toBe(true);
  });
});
