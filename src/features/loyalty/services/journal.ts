import { LOYALTY_JOURNAL_KEY } from "../constants";
import type { LoyaltyInput, LoyaltyJournal } from "../types/loyalty";
import { loyaltyJournalSchema } from "../validation/schemas";
import { configFingerprint } from "@/features/business-config/services/journal";
import { writeStaffJournal } from "@/features/staff/services/journal-storage";

export function readLoyaltyJournal(actorUserId: string) {
  const stored = sessionStorage.getItem(LOYALTY_JOURNAL_KEY);
  if (!stored) return null;
  const parsed = loyaltyJournalSchema.safeParse(JSON.parse(stored));
  if (!parsed.success) throw new Error("Hay una operación de otra sección o un registro inválido. Comprueba el guardado en Configuración antes de operar una tarjeta.");
  if (parsed.data.actorUserId !== actorUserId) throw new Error("La operación pendiente pertenece a otra sesión. Solicita revisión del responsable.");
  return parsed.data;
}
export function writeLoyaltyJournal(journal: LoyaltyJournal) {
  writeStaffJournal(loyaltyJournalSchema.parse(journal));
}
export function clearLoyaltyJournal() { sessionStorage.removeItem(LOYALTY_JOURNAL_KEY); }
export function loyaltyFingerprint(kind: string, input: LoyaltyInput) {
  const normalized = { ...input, operationId: undefined };
  return configFingerprint({ kind, input: Object.fromEntries(Object.entries(normalized).sort(([first], [second]) => first.localeCompare(second))) });
}

export function journalTimestamp() { return Date.now(); }
