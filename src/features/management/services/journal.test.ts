import { afterEach, expect, it, vi } from "vitest";

import { managementFingerprint, readManagementJournal, writeManagementJournal } from "./journal";
import type { ManagementJournal } from "../types/management";
import { STAFF_JOURNAL_KEY } from "@/features/identity/constants";

const actor = "77000000-0000-4000-8000-000000000001";
const operationId = "77000000-0000-4000-8000-000000000002";
const record: ManagementJournal = { feature: "h7-management", actorUserId: actor, operationId, kind: "invite", fingerprint: "a".repeat(64), createdAt: 1 };
afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
it("diario administrativo no almacena correo ni texto y rechaza otra sesión", () => {
  writeManagementJournal(record); expect(readManagementJournal(actor)).toEqual(record);
  expect(() => readManagementJournal(operationId)).toThrow("otra sección o sesión");
  expect(Object.keys(JSON.parse(sessionStorage.getItem(STAFF_JOURNAL_KEY) ?? "{}"))).toEqual(Object.keys(record));
});
it("no pisa otra operación ni tolera cuota insuficiente", () => {
  writeManagementJournal(record);
  expect(() => writeManagementJournal({ ...record, operationId: actor })).toThrow("otra operación");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
  expect(() => writeManagementJournal(record)).toThrow("QuotaExceededError");
});
it("huella conserva entrada y tipo pero no cambia al recuperar el UUID", async () => {
  const input = { email: "h7@example.test", role: "attendant" as const, operationId };
  expect(await managementFingerprint("invite", input)).toBe(await managementFingerprint("invite", { ...input, operationId: actor }));
  expect(await managementFingerprint("invite", input)).not.toBe(await managementFingerprint("invite", { ...input, role: "manager" }));
});
