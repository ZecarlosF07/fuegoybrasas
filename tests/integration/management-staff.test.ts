import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffAdmin, staffPool } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";

import { invitationContextSchema, invitationStageSchema, managedStaffSchema } from "@/features/management/validation/dto";

const fixtures: StaffFixture[] = [];
let manager: StaffFixture, attendant: StaffFixture;
beforeAll(async () => { manager = await createStaffFixture("manager"); attendant = await createStaffFixture("attendant"); fixtures.push(manager, attendant); });
afterAll(async () => { await cleanupStaffFixtures(fixtures); await staffPool.end(); });
async function reservation(email: string, operationId = randomUUID()) {
  const result = (await actorQuery(manager, "select public.prepare_staff_invitation($1,'attendant',$2) data", [email, operationId])).rows[0].data;
  return { email, operationId, staffId: String(result.entityId) };
}
async function stage(value: Awaited<ReturnType<typeof reservation>>) {
  const created = await staffAdmin.createUser({ email: value.email, email_confirm: false, app_metadata: { fybInvitation: value.staffId } });
  if (created.error || !created.data.user) throw new Error("No se pudo preparar Auth sintético.");
  const fixture = { userId: created.data.user.id, email: value.email, password: "", staffId: value.staffId }; fixtures.push(fixture);
  const result = invitationStageSchema.parse((await actorQuery(manager, "select public.stage_staff_invitation($1,'attendant',$2,$3) data", [value.email, value.operationId, fixture.userId])).rows[0].data);
  return { fixture, result };
}
describe("H7 invitaciones y conciliación con Auth real local", () => {
  it("reserva única por correo, incluso con otro rol y actor", async () => {
    const email = `h7-${randomUUID()}@example.test`; const value = await reservation(email);
    expect((await actorQuery(manager, "select public.prepare_staff_invitation($1,'attendant',$2) data", [email, value.operationId])).rows[0].data.replayed).toBe(true);
    await expect(actorQuery(manager, "select public.prepare_staff_invitation($1,'manager',$2)", [email, randomUUID()])).rejects.toThrow("CONFLICT");
    await expect(actorQuery(attendant, "select public.prepare_staff_invitation($1,'attendant',$2)", [email, randomUUID()])).rejects.toThrow("FORBIDDEN");
  });
  it("cuenta pendiente no tiene acceso; dos intentos no envían a la vez", async () => {
    const value = await reservation(`h7-${randomUUID()}@example.test`); const prepared = await stage(value);
    expect(prepared.result.sendAllowed).toBe(true);
    const second = invitationStageSchema.parse((await actorQuery(manager, "select public.stage_staff_invitation($1,'attendant',$2,$3) data", [value.email, value.operationId, prepared.fixture.userId])).rows[0].data);
    expect(second.sendAllowed).toBe(false);
    await expect(actorQuery(prepared.fixture, "select public.get_staff_access()")).rejects.toThrow("FORBIDDEN");
    await expect(actorQuery(manager, "select public.complete_staff_invitation($1,'attendant',$2,$3)", [value.email, value.operationId, randomUUID()])).rejects.toThrow("CONFIG_NOT_READY");
  });
  it("invitación envía correo, concilia respuesta perdida y permite completar MFA", async () => {
    const value = await reservation(`h7-${randomUUID()}@example.test`); const prepared = await stage(value);
    const sent = await staffAdmin.inviteUserByEmail(value.email, { redirectTo: "http://127.0.0.1:3100/auth/confirm" });
    expect(sent.error).toBeNull(); expect(sent.data.user?.id).toBe(prepared.fixture.userId);
    const context = invitationContextSchema.parse((await actorQuery(manager, "select public.get_staff_invitation_context($1,'attendant',$2) data", [value.email, value.operationId])).rows[0].data);
    expect(context.invitedAt).not.toBeNull();
    const operation = randomUUID();
    await actorQuery(manager, "select public.complete_staff_invitation($1,'attendant',$2,$3)", [value.email, value.operationId, operation]);
    expect((await actorQuery(manager, "select public.complete_staff_invitation($1,'attendant',$2,$3) data", [value.email, value.operationId, operation])).rows[0].data.replayed).toBe(true);
    const receipt = (await actorQuery(manager, "select public.get_operation($1) data", [value.operationId])).rows[0].data;
    expect(receipt.result.outcome).toBe("applied"); expect(receipt.currentState.state).toBe("sent");
    const access = (await actorQuery({ ...prepared.fixture, aal: "aal1" }, "select public.get_staff_access() data")).rows[0].data;
    expect(access.assuranceLevel).toBe("aal1");
    await expect(actorQuery({ ...prepared.fixture, aal: "aal1" }, "select public.lookup_customer('+51999000001')")).rejects.toThrow("MFA_REQUIRED");
  });
  it("no reutiliza una identidad existente ajena ni confía en metadata del usuario", async () => {
    const value = await reservation(attendant.email);
    await expect(actorQuery(manager, "select public.get_staff_invitation_context($1,'attendant',$2)", [attendant.email, value.operationId])).rejects.toThrow("CONFLICT");
    await expect(actorQuery(manager, "select public.stage_staff_invitation($1,'attendant',$2,$3)", [value.email, value.operationId, attendant.userId])).rejects.toThrow("CONFLICT");
  });
  it("listado privado incluye estado real y sigue protegiendo revocación/restauración", async () => {
    const data = managedStaffSchema.parse((await actorQuery(manager, "select public.get_managed_staff() data")).rows[0].data);
    expect(data.staff.some((entry) => entry.id === manager.staffId && entry.email === manager.email)).toBe(true);
    await expect(actorQuery(attendant, "select public.get_managed_staff()")).rejects.toThrow("FORBIDDEN");
    const entry = data.staff.find((employee) => employee.id === attendant.staffId);
    if (!entry) throw new Error("Falta personal sintético.");
    await actorQuery(manager, "select public.soft_delete_entity('staff_account',$1,$2,'Acceso retirado por prueba',$3)", [entry.id, entry.revision, randomUUID()]);
    await actorQuery(manager, "select public.restore_entity('staff_account',$1,$2,'Restaurar sin reautorizar acceso',$3)", [entry.id, entry.revision + 1, randomUUID()]);
    await expect(actorQuery(attendant, "select public.get_staff_access()")).rejects.toThrow("FORBIDDEN");
  });
});
