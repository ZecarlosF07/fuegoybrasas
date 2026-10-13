import { z } from "zod";

import type { ConfigJournal } from "../types/journal";
import { STAFF_JOURNAL_KEY } from "@/features/identity/constants";
import { writeStaffJournal } from "@/features/staff/services/journal-storage";

const journalSchema = z.strictObject({ actorUserId: z.uuid(), operationId: z.uuid(), expectedRevision: z.number().int().positive(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.number().int().positive() });
export function readConfigJournal(actorUserId: string) {
  const stored = sessionStorage.getItem(STAFF_JOURNAL_KEY);
  if (!stored) return null;
  const parsed = journalSchema.safeParse(JSON.parse(stored));
  if (!parsed.success || parsed.data.actorUserId !== actorUserId) throw new Error("Hay una operación pendiente de otra sesión o un registro inválido. Cierra sesión y consulta al responsable.");
  return parsed.data;
}
export function writeConfigJournal(journal: ConfigJournal) {
  writeStaffJournal(journalSchema.parse(journal));
}
export function clearConfigJournal() { sessionStorage.removeItem(STAFF_JOURNAL_KEY); }
export async function configFingerprint(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
