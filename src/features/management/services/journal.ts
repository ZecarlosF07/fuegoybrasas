import type { ManagementGuardState, ManagementInput, ManagementJournal, ManagementKind } from "../types/management";
import { managementJournalSchema } from "../validation/schemas";
import { configFingerprint } from "@/features/business-config/services/journal";
import { STAFF_JOURNAL_KEY } from "@/features/identity/constants";
import { writeStaffJournal } from "@/features/staff/services/journal-storage";

export function readManagementJournal(actorUserId: string) {
  const raw = sessionStorage.getItem(STAFF_JOURNAL_KEY);
  if (!raw) return null;
  const parsed = managementJournalSchema.safeParse(JSON.parse(raw));
  if (!parsed.success || parsed.data.actorUserId !== actorUserId) throw new Error("Hay una operación pendiente de otra sección o sesión. Comprueba su resultado allí antes de intervenir.");
  return parsed.data;
}
export function writeManagementJournal(value: ManagementJournal) { writeStaffJournal(managementJournalSchema.parse(value)); }
export function clearManagementJournal() { sessionStorage.removeItem(STAFF_JOURNAL_KEY); }
export function managementFingerprint(kind: ManagementKind, input: ManagementInput) {
  const payload = Object.entries(input).filter(([key]) => key !== "operationId");
  return configFingerprint({ kind, input: Object.fromEntries(payload.sort(([first], [second]) => first.localeCompare(second))) });
}
export function managementTimestamp() { return Date.now(); }
export function managementBlocked(operation: ManagementGuardState, kind: ManagementKind) {
  return !operation.ready || operation.pending || (operation.journal !== null && (!operation.checked || operation.journal.kind !== kind));
}
