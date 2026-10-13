import { afterEach, expect, it, vi } from "vitest";

import { readLoyaltyJournal, writeLoyaltyJournal } from "./journal";
import type { LoyaltyJournal } from "../types/loyalty";
import { writeConfigJournal } from "@/features/business-config/services/journal";
import { STAFF_JOURNAL_KEY } from "@/features/identity/constants";

const actor = "60000000-0000-4000-8000-000000000001", operationId = "60000000-0000-4000-8000-000000000002";
const record: LoyaltyJournal = { actorUserId: actor, operationId, customerId: actor, programId: null, rewardId: null, kind: "credit", fingerprint: "a".repeat(64), createdAt: 1 };
afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
  it("persiste solo datos mínimos y rechaza otro actor", () => {
    writeLoyaltyJournal(record); expect(readLoyaltyJournal(actor)).toEqual(record);
    expect(() => readLoyaltyJournal(operationId)).toThrow("otra sesión");
    expect(Object.keys(JSON.parse(sessionStorage.getItem(STAFF_JOURNAL_KEY) ?? "{}"))).not.toContain("phone");
  });
  it("no sobrescribe una operación iniciada por otra sección montada", () => {
    writeLoyaltyJournal(record);
    expect(() => writeConfigJournal({ actorUserId: actor, operationId, expectedRevision: 1, fingerprint: record.fingerprint, createdAt: 1 })).toThrow("otra operación");
    expect(readLoyaltyJournal(actor)).toEqual(record);
  });
  it("conserva un reintento idéntico y rechaza otro identificador", () => {
    writeLoyaltyJournal(record); writeLoyaltyJournal(record);
    expect(() => writeLoyaltyJournal({ ...record, operationId: actor })).toThrow("otra operación");
  });
  it("un almacenamiento no disponible falla antes de poder enviar", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(() => writeLoyaltyJournal(record)).toThrow("QuotaExceededError");
  });
