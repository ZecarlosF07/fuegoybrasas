import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool, testAuthClient } from "./staff-fixture";
import type { JwtTestActor, StaffFixture } from "./types/staff-fixture";

const fixtures: StaffFixture[] = [];
let manager: StaffFixture, attendant: StaffFixture, outsider: StaffFixture;
beforeAll(async () => {
  manager = await createStaffFixture("manager"); fixtures.push(manager);
  attendant = await createStaffFixture("attendant", manager.staffId ?? undefined); fixtures.push(attendant);
  outsider = await createStaffFixture(null); fixtures.push(outsider);
});
afterAll(async () => { await cleanupStaffFixtures(fixtures); await staffPool.end(); });

describe("H2 autorización real y conservación", () => {
  it("mantiene el alta pública bloqueada aunque el proveedor email esté activo", async () => {
    const result = await testAuthClient().auth.signUp({ email: `disabled-${randomUUID()}@example.test`, password: "Synthetic-password-only-2026!" });
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain("signup_disabled");
  });
  it("niega CRUD directo, ejecución anónima y acceso al puente de claims", async () => {
    const result = await staffPool.query("select has_schema_privilege('authenticated','app_private','usage') private_usage, has_function_privilege('anon','public.get_staff_access()','execute') anonymous_rpc, has_function_privilege('authenticated','app_private.request_claims()','execute') claims_bridge, has_table_privilege('authenticated','public.business_settings','select,insert,update,delete') direct_config");
    expect(result.rows[0]).toEqual({ private_usage: false, anonymous_rpc: false, claims_bridge: false, direct_config: false });
    await expect(actorQuery(manager, "select * from public.business_settings")).rejects.toMatchObject({ code: "42501" });
    await expect(actorQuery(manager, "select * from app_private.staff_accounts")).rejects.toMatchObject({ code: "42501" });
  });
  it("usuario externo y atención no pueden leer configuración; metadata no eleva rol", async () => {
    await expect(actorQuery(outsider, "select public.get_staff_access()")).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(actorQuery(attendant, "select public.get_admin_config()")).rejects.toMatchObject({ message: "FORBIDDEN" });
    const own = await actorQuery(attendant, "select public.get_staff_access() data");
    expect(own.rows[0].data.role).toBe("attendant");
  });
  it("contraseña AAL1 permite configuración solo con autorización vigente", async () => {
    const actor: JwtTestActor = { userId: manager.userId, aal: "aal1" };
    expect((await actorQuery(actor, "select public.get_staff_access() data")).rows[0].data.assuranceLevel).toBe("aal1");
    expect((await actorQuery(actor, "select public.get_admin_config() data")).rows[0].data).toBeTruthy();
    expect((await actorQuery(actor, "select public.has_staff_role('manager') allowed")).rows[0].allowed).toBe(true);
  });
  it("JWT Auth de contraseña accede y una baja revoca permisos sin esperar al vencimiento", async () => {
    const client = testAuthClient();
    expect((await client.auth.signInWithPassword({ email: manager.email, password: manager.password })).error).toBeNull();
    expect((await client.rpc("get_staff_access")).data).toMatchObject({ assuranceLevel: "aal1" });
    expect((await client.rpc("get_admin_config")).error).toBeNull();
    await staffPool.query("update app_private.staff_accounts set active=false where auth_user_id=$1", [manager.userId]);
    try {
      expect((await client.auth.getUser()).error).toBeNull();
      expect((await client.rpc("get_staff_access")).error?.message).toBe("FORBIDDEN");
      expect((await client.rpc("get_admin_config")).error?.message).toBe("FORBIDDEN");
    } finally { await staffPool.query("update app_private.staff_accounts set active=true where auth_user_id=$1", [manager.userId]); }
    await client.auth.signOut();
  });
  it("elimina/restaura sin reactivar y bloquea JWT revocado y replay", async () => {
    const operation = randomUUID();
    const deleted = await actorQuery(manager, "select public.soft_delete_entity('staff_account',$1,1,'Baja sintética de prueba',$2) data", [attendant.staffId, operation]);
    expect(deleted.rows[0].data.revision).toBe(2);
    await expect(actorQuery(attendant, "select public.get_staff_access()")).rejects.toMatchObject({ message: "FORBIDDEN" });
    const restored = await actorQuery(manager, "select public.restore_entity('staff_account',$1,2,'Restauración de prueba',$2) data", [attendant.staffId, randomUUID()]);
    expect(restored.rows[0].data.revision).toBe(3);
    const current = await staffPool.query("select active,deleted_at,revision,auth_user_id from app_private.staff_accounts where id=$1", [attendant.staffId]);
    expect(current.rows[0]).toMatchObject({ active: false, deleted_at: null, revision: 3, auth_user_id: attendant.userId });
    await expect(actorQuery(attendant, "select public.get_staff_access()")).rejects.toMatchObject({ message: "FORBIDDEN" });
  });
  it("rechaza motivos cortos, tablas libres y actor enviado por patch", async () => {
    await expect(actorQuery(manager, "select public.soft_delete_entity('staff_account',$1,3,'corto',$2)", [attendant.staffId, randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(actorQuery(manager, "select public.soft_delete_entity('auth.users',$1,3,'Motivo de prueba válido',$2)", [attendant.staffId, randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await expect(actorQuery(manager, "select public.update_staff_access($1,3,'{\"actor\":\"manager\"}',$2)", [attendant.staffId, randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("no permite UPDATE/DELETE del historial ni eliminación física", async () => {
    await expect(staffPool.query("update app_private.audit_entries set changed_fields='{}' where actor_user_id=$1", [manager.userId])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(staffPool.query("delete from app_private.operation_receipts where actor_user_id=$1", [manager.userId])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(staffPool.query("delete from app_private.staff_accounts where id=$1", [attendant.staffId])).rejects.toMatchObject({ message: "FORBIDDEN" });
    await expect(staffPool.query("delete from public.business_settings")).rejects.toMatchObject({ message: "FORBIDDEN" });
  });
});
