import { z } from "zod";

import { CATALOG_ENTITY_TYPES, CATALOG_JOURNAL_KEY } from "../constants";
import type { Journal } from "../types/catalog-admin";
import type { CatalogOperationInput } from "../types/operation";
import { configFingerprint } from "@/features/business-config/services/journal";

export const catalogJournalSchema = z.strictObject({ actorUserId: z.uuid(), operationId: z.uuid(), entityId: z.uuid(), entityType: z.enum(["payment_method", "delivery_zone", ...CATALOG_ENTITY_TYPES]), configRevision: z.number().int().positive().optional(), expectedRevision: z.number().int().nonnegative(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.number().positive(), kind: z.enum(["save", "delete", "restore"]) });
export function readCatalogJournal(actorUserId: string) {
  const stored = sessionStorage.getItem(CATALOG_JOURNAL_KEY);
  if (!stored) return null;
  const parsed = catalogJournalSchema.safeParse(JSON.parse(stored));
  if (!parsed.success || parsed.data.actorUserId !== actorUserId) throw new Error("El registro pendiente no corresponde a esta sesión. Consulta al responsable.");
  return parsed.data;
}
export function writeCatalogJournal(journal: Journal) { sessionStorage.setItem(CATALOG_JOURNAL_KEY, JSON.stringify(journal)); }
export function clearCatalogJournal() { sessionStorage.removeItem(CATALOG_JOURNAL_KEY); }
export function catalogFingerprint(input: CatalogOperationInput, kind: string) {
  const canonical = "patch" in input ? { ...input, operationId: undefined, patch: Object.fromEntries(Object.entries(input.patch).sort(([first], [second]) => first.localeCompare(second))) } : input;
  return configFingerprint({ kind, input: canonical });
}
