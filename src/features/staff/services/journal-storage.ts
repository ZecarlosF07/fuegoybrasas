import type { StaffJournalReference } from "../types/journal";
import { STAFF_JOURNAL_KEY } from "@/features/identity/constants";

export function writeStaffJournal(value: StaffJournalReference) {
  const serialized = JSON.stringify(value);
  const previous = sessionStorage.getItem(STAFF_JOURNAL_KEY);
  if (previous && previous !== serialized) throw new Error("Hay otra operación pendiente. Consulta su resultado antes de iniciar una nueva.");
  sessionStorage.setItem(STAFF_JOURNAL_KEY, serialized);
}
