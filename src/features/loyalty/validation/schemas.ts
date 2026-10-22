import { z } from "zod";

import { LOYALTY_TERMS_VERSION } from "../constants";
import { staffCardSchema } from "./dto";
import { mutationSchema } from "@/features/staff/validation/schemas";

export const phoneSchema = z.string().trim().max(24).transform((value) => {
  const digits = value.replace(/[ ()-]/g, "");
  return /^9[0-9]{8}$/.test(digits) ? "+51" + digits : /^519[0-9]{8}$/.test(digits) ? "+" + digits : digits;
}).pipe(z.string().regex(/^\+519[0-9]{8}$/, "Escribe un celular peruano de nueve dígitos que empiece por 9."));
export const cardKeySchema = z.string().regex(/^[a-f0-9]{64}$/);
export const activateSchema = z.strictObject({
  displayName: z.string().trim().min(1, "Escribe tu nombre.").max(80), termsVersion: z.literal(LOYALTY_TERMS_VERSION),
  termsAccepted: z.literal(true, { error: "Debes aceptar las condiciones vigentes." }),
});
export const registerCardSchema = activateSchema.extend({ phone: phoneSchema });
export const changeContactSchema = z.strictObject({ phone: phoneSchema, expectedRevision: z.number().int().positive() });
export const profileSchema = z.strictObject({
  displayName: z.string().trim().min(1, "Escribe tu nombre.").max(80), frequentInstructions: z.string().max(500),
  expectedRevision: z.number().int().positive(),
});
const operationIdentity = { customerId: z.uuid(), operationId: z.uuid() };
export const creditSchema = z.strictObject({
  ...operationIdentity, paidConfirmed: z.literal(true, { error: "Confirma que la compra presencial está pagada." }),
  deliveredConfirmed: z.literal(true, { error: "Confirma que el pedido ya fue entregado." }),
  visitReference: z.string().trim().max(80).transform((value) => value || null).nullable().optional(),
});
export const redeemSchema = z.strictObject({
  ...operationIdentity, rewardId: z.uuid(), laterVisitConfirmed: z.literal(true, { error: "Confirma que el canje corresponde a otra visita posterior." }),
  productAvailableConfirmed: z.literal(true, { error: "Confirma con cocina que el premio puede entregarse." }),
});
export const incidentSchema = z.strictObject({
  ...operationIdentity, type: z.enum(["reward_delivery_failed", "other"]), description: z.string().trim().min(10).max(500),
  rewardId: z.uuid().nullable().optional(), sourceEventId: z.uuid().nullable().optional(),
});
export const cardMutationSchema = mutationSchema.extend({
  entityType: z.literal("loyalty_card"), customerId: z.uuid(), eventId: z.uuid().optional(), rewardId: z.uuid().nullable().optional(),
  incidentId: z.uuid().optional(), card: staffCardSchema.nullable(),
});
export const lookupSchema = z.discriminatedUnion("found", [
  z.object({ found: z.literal(false) }), z.object({ found: z.literal(true), card: staffCardSchema }),
]);
const programIdentity = { programId: z.uuid(), expectedRevision: z.number().int().positive(), operationId: z.uuid() };
export const activationChecksSchema = z.strictObject({
  termsApproved: z.literal(true), privacyApproved: z.literal(true), accessTested: z.literal(true), staffReady: z.literal(true),
});
export const programActivationSchema = z.strictObject({
  ...programIdentity, costCents: z.number().int().nonnegative().nullable(), termsVersion: z.literal(LOYALTY_TERMS_VERSION), checks: activationChecksSchema,
});
export const availabilitySchema = z.strictObject({ ...programIdentity, available: z.boolean() });
export const costSchema = z.strictObject({ ...programIdentity, costCents: z.number().int().nonnegative().nullable() });
export const loyaltyJournalSchema = z.strictObject({
  actorUserId: z.uuid(), operationId: z.uuid(), customerId: z.uuid().nullable(), programId: z.uuid().nullable(),
  rewardId: z.uuid().nullable(), kind: z.enum(["credit", "redeem", "incident", "activate", "availability", "cost"]),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.number().int().positive(),
});
