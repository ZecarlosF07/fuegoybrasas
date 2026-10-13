import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";

const fixtures: StaffFixture[] = [];
let first: StaffFixture, second: StaffFixture, target: StaffFixture;
let original: Record<string, unknown>;
beforeAll(async () => {
  first = await createStaffFixture("manager"); fixtures.push(first);
  second = await createStaffFixture("manager", first.staffId ?? undefined); fixtures.push(second);
  target = await createStaffFixture("attendant", first.staffId ?? undefined); fixtures.push(target);
  original = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
});
afterAll(async () => {
  if (original) await staffPool.query("update public.business_settings set display_name=$1,revision=$2,updated_at=$3 where id=1", [original.display_name, original.revision, original.updated_at]);
  await cleanupStaffFixtures(fixtures); await staffPool.end();
});
async function configRevision() { return Number((await staffPool.query("select revision from public.business_settings where id=1")).rows[0].revision); }

describe("H2 transacciones e idempotencia", () => {
  it("not_found durante una petición bloqueada conserva el mismo UUID para un único efecto", async () => {
    const operation = randomUUID();
    const revision = await configRevision();
    const connection = await staffPool.connect();
    await connection.query("begin");
    await connection.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [`${first.userId}:${operation}`]);
    const inflight = actorQuery(first, "/* h2-config-inflight */ select public.update_business_config($1,'{\"timezone\":\"America/Lima\"}',$2) data", [revision, operation]);
    try {
      let waiting = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        const state = await staffPool.query("select count(*)::int total from pg_stat_activity where query like '/* h2-config-inflight */%' and wait_event='advisory'");
        if (state.rows[0].total > 0) { waiting = true; break; }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      expect((await actorQuery(first, "select public.get_operation($1) data", [operation])).rows[0].data.status).toBe("not_found");
    } finally { await connection.query("commit"); connection.release(); }
    expect((await inflight).rows[0].data.operationId).toBe(operation);
    const replay = await actorQuery(first, "select public.update_business_config($1,'{\"timezone\":\"America/Lima\"}',$2) data", [revision, operation]);
    expect(replay.rows[0].data.replayed).toBe(true);
  });
  it("dos reintentos simultáneos producen una sola revisión, recibo y auditoría", async () => {
    const operation = randomUUID();
    const revision = await configRevision();
    const sql = "select public.update_business_config($1,$2,$3) data";
    const values = [revision, JSON.stringify({ displayName: "Configuración sintética H2" }), operation];
    const results = await Promise.all([actorQuery(first, sql, values), actorQuery(first, sql, values)]);
    expect(results.map((result) => result.rows[0].data.replayed).sort()).toEqual([false, true]);
    expect(await configRevision()).toBe(revision + 1);
    const counts = await staffPool.query("select (select count(*)::int from app_private.operation_receipts where actor_user_id=$1 and operation_id=$2) receipts,(select count(*)::int from app_private.audit_entries where actor_user_id=$1 and operation_id=$2) audits", [first.userId, operation]);
    expect(counts.rows[0]).toEqual({ receipts: 1, audits: 1 });
    await expect(actorQuery(first, sql, [revision, '{"displayName":"Otros datos"}', operation])).rejects.toMatchObject({ message: "IDEMPOTENCY_CONFLICT" });
    const found = await actorQuery(first, "select public.get_operation($1) data", [operation]);
    expect(found.rows[0].data).toMatchObject({ status: "recorded", result: { revision: revision + 1, replayed: false }, currentState: { revision: revision + 1 } });
    expect((await actorQuery(second, "select public.get_operation($1) data", [operation])).rows[0].data.status).toBe("not_found");
  });
  it("no-op registra recibo sin auditoría ni incremento y no expone PII", async () => {
    const operation = randomUUID();
    const revision = await configRevision();
    await actorQuery(first, "select public.update_business_config($1,'{\"timezone\":\"America/Lima\"}',$2)", [revision, operation]);
    expect(await configRevision()).toBe(revision);
    const count = await staffPool.query("select count(*)::int total from app_private.audit_entries where actor_user_id=$1 and operation_id=$2", [first.userId, operation]);
    expect(count.rows[0].total).toBe(0);
    const history = await staffPool.query("select changed_fields from app_private.audit_entries where actor_user_id=$1", [first.userId]);
    expect(JSON.stringify(history.rows)).not.toContain("Configuración sintética");
  });
  it("revision antigua, activación prematura y horario superpuesto revierten sin recibos", async () => {
    await expect(actorQuery(first, "select public.update_business_config($1,'{\"displayName\":\"Viejo\"}',$2)", [original.revision, randomUUID()])).rejects.toMatchObject({ message: "CONFLICT" });
    await expect(actorQuery(first, "select public.update_business_config($1,'{\"orderingEnabled\":true}',$2)", [await configRevision(), randomUUID()])).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
    const schedule = [{ day: 1, opensAt: "12:00", closesAt: "15:00", closesNextDay: false }, { day: 1, opensAt: "14:00", closesAt: "18:00", closesNextDay: false }];
    await expect(actorQuery(first, "select public.update_business_config($1,$2,$3)", [await configRevision(), JSON.stringify({ openingPeriods: schedule }), randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("reintentos del acceso tienen un solo efecto y una revocación impide leer/repetir recibos", async () => {
    const operation = randomUUID();
    const results = await Promise.all([1, 2].map(() => actorQuery(first, "select public.update_staff_access($1,1,'{\"active\":false}',$2) data", [target.staffId, operation])));
    expect(results.map((result) => result.rows[0].data.replayed).sort()).toEqual([false, true]);
    await actorQuery(second, "select public.update_staff_access($1,1,'{\"active\":false}',$2)", [first.staffId, randomUUID()]);
    await expect(actorQuery(first, "select public.get_operation($1)", [operation])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(actorQuery(first, "select public.update_staff_access($1,1,'{\"active\":false}',$2)", [target.staffId, operation])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await actorQuery(second, "select public.update_staff_access($1,2,'{\"active\":true}',$2)", [first.staffId, randomUUID()]);
  });
  it("dos managers que dan de baja al otro conservan exactamente un responsable", async () => {
    const prior = await staffPool.query("select id,revision from app_private.staff_accounts where id=any($1::uuid[])", [[first.staffId, second.staffId]]);
    const revisions = new Map(prior.rows.map((row) => [row.id, row.revision]));
    const results = await Promise.allSettled([
      actorQuery(first, "select public.update_staff_access($1,$2,'{\"active\":false}',$3)", [second.staffId, revisions.get(second.staffId), randomUUID()]),
      actorQuery(second, "select public.update_staff_access($1,$2,'{\"active\":false}',$3)", [first.staffId, revisions.get(first.staffId), randomUUID()]),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const count = await staffPool.query("select count(*)::int total from app_private.staff_accounts where active and deleted_at is null and role='manager' and id=any($1::uuid[])", [[first.staffId, second.staffId]]);
    expect(count.rows[0].total).toBe(1);
    const active = (await staffPool.query("select auth_user_id from app_private.staff_accounts where active and role='manager' and id=any($1::uuid[])", [[first.staffId, second.staffId]])).rows[0].auth_user_id;
    const inactive = (await staffPool.query("select id,revision from app_private.staff_accounts where not active and id=any($1::uuid[])", [[first.staffId, second.staffId]])).rows[0];
    await expect(actorQuery({ userId: active }, "select public.update_staff_access($1,$2,'{\"active\":false}',$3)", [active === first.userId ? first.staffId : second.staffId, revisions.get(active === first.userId ? first.staffId : second.staffId), randomUUID()])).rejects.toMatchObject({ message: "CONFLICT" });
    expect(inactive).toBeDefined();
  });
});
