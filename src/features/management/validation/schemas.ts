import { z } from "zod";

import { conservationSchema, staffChangeSchema } from "@/features/staff/validation/schemas";

export const managementReason = z.string().trim().min(10, "Explica el motivo con al menos diez caracteres.").max(500);
const identity = { operationId: z.uuid() };
export const reverseSchema = z.strictObject({ ...identity, customerId: z.uuid(), eventId: z.uuid(), reason: managementReason });
export const correctionSchema = z.strictObject({
  ...identity, customerId: z.uuid(), expectedRevision: z.number().int().positive(), displayName: z.string().trim().min(1).max(80),
  frequentInstructions: z.string().max(500), customerRequestConfirmed: z.literal(true, { error: "Confirma la solicitud expresa del cliente." }), reason: managementReason,
});
export const closeIncidentSchema = z.strictObject({ ...identity, incidentId: z.uuid(), expectedRevision: z.number().int().positive(), resolutionNote: managementReason });
export const paginationSchema = z.strictObject({ cursor: z.uuid().nullable().default(null), limit: z.number().int().min(1).max(50).default(20) });
export const historyQuerySchema = paginationSchema.extend({ customerId: z.uuid() });
export const customersQuerySchema = paginationSchema.extend({ filter: z.enum(["all", "near_reward", "available_reward"]).default("all") });
export const incidentsQuerySchema = paginationSchema.extend({ status: z.enum(["open", "closed", "all"]).default("open"), includeDeleted: z.boolean().default(false) });
export const periodSchema = z.strictObject({ from: z.iso.date(), until: z.iso.date() }).refine(
  ({ from, until }) => until >= from && (Date.parse(until) - Date.parse(from)) / 86_400_000 <= 366,
  { message: "Selecciona un periodo válido de hasta 366 días.", path: ["until"] },
);
export const invitationSchema = z.strictObject({ operationId: z.uuid(), email: z.email().trim().toLowerCase().max(254), role: z.enum(["attendant", "manager"]) });
export const reinstateSchema = z.strictObject({ ...identity, incidentId: z.uuid(), expectedRevision: z.number().int().positive(), notDeliveredConfirmed: z.literal(true, { error: "Confirma que el premio no fue entregado." }), reason: managementReason });
export const recoverSchema = z.strictObject({ ...identity, customerId: z.uuid(), expectedRevision: z.number().int().positive(), reference: z.string().trim().min(1).max(80), historyEventId: z.uuid(),
  inPersonConfirmed: z.literal(true, { error: "Confirma la presencia del titular." }), identityCheckedConfirmed: z.literal(true, { error: "Comprueba la titularidad con el comprobante y el historial; el teléfono no basta." }), reason: managementReason });
export const contingencySchema = z.strictObject({ ...identity, customerId: z.uuid(), occurredAt: z.iso.datetime({ offset: true }), visitReference: z.string().trim().min(1).max(80), reason: managementReason,
  paidConfirmed: z.literal(true, { error: "Confirma que la compra presencial está pagada." }), deliveredConfirmed: z.literal(true, { error: "Confirma la entrega física del pedido." }) });
export const managementInputSchema = z.union([reverseSchema, correctionSchema, closeIncidentSchema, staffChangeSchema, conservationSchema, invitationSchema, reinstateSchema, recoverSchema, contingencySchema]);
export const managementJournalSchema = z.strictObject({
  feature: z.literal("h7-management"), actorUserId: z.uuid(), operationId: z.uuid(),
  kind: z.enum(["reverse", "correct", "close", "staff", "delete", "restore", "invite", "reinstate", "recover", "contingency"]),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.number().int().positive(),
});
