import { z } from "zod";

import { CART_MAX_CHOICES, CART_MAX_LINES, CART_MAX_QUANTITY, CART_MAX_UNITS } from "../constants";
import { ERROR_CODES } from "@/contracts/error-codes";
import { publicZoneSchema } from "@/features/checkout-config/validation/schemas";

const cents = z.number().int().min(0).max(2147483647);
export const modeSchema = z.enum(["delivery", "pickup"]);
const choices = z.array(z.uuid()).max(CART_MAX_CHOICES).refine((ids) => new Set(ids).size === ids.length, "No repitas una opción.");
export const validationLineSchema = z.strictObject({ lineId: z.uuid(), itemId: z.uuid(), quantity: z.number().int().min(1).max(CART_MAX_QUANTITY), choiceIds: choices, observedItemRevision: z.number().int().positive(), observedUnitPriceCents: cents });
const lineArray = z.array(validationLineSchema).min(1).max(CART_MAX_LINES).refine((lines) => new Set(lines.map((line) => line.lineId)).size === lines.length && lines.reduce((sum, line) => sum + line.quantity, 0) <= CART_MAX_UNITS);
export const cartValidationSchema = z.strictObject({ mode: modeSchema, deliveryZoneId: z.uuid().optional(), lines: lineArray });
export const cartLineSchema = validationLineSchema.extend({ instructions: z.string().trim().max(200), instructionsStatus: z.enum(["ready", "needs_review"]), displaySnapshot: z.strictObject({ name: z.string().min(1).max(120), portion: z.string().max(80), choices: z.array(z.string().min(1).max(120)).max(CART_MAX_CHOICES) }) });
export const storedLineSchema = cartLineSchema.omit({ instructions: true, instructionsStatus: true }).extend({ hadInstructions: z.boolean() });
export const storedCartSchema = z.strictObject({ schemaVersion: z.literal(1), updatedAt: z.iso.datetime(), mode: modeSchema.nullable(), writerId: z.uuid(), lines: z.array(storedLineSchema).max(CART_MAX_LINES) }).refine((draft) => new Set(draft.lines.map((line) => line.lineId)).size === draft.lines.length && draft.lines.reduce((sum, line) => sum + line.quantity, 0) <= CART_MAX_UNITS && draft.lines.reduce((sum, line) => sum + line.quantity * line.observedUnitPriceCents, 0) <= 2147483647);
export const checkoutFieldsSchema = z.strictObject({ name: z.string().trim().max(80), address: z.string().trim().max(250), reference: z.string().trim().max(200), deliveryZoneId: z.string().max(36), instructions: z.string().trim().max(500) });
// La sesión anterior puede contener pago/vuelto: se descartan al recuperar, sin perder el pedido.
const persistedCheckoutFieldsSchema = z.object(checkoutFieldsSchema.shape);
export const storedCheckoutSchema = z.strictObject({ schemaVersion: z.literal(1), fields: persistedCheckoutFieldsSchema, lineInstructions: z.record(z.uuid(), z.string().trim().max(200)) }).refine((data) => Object.keys(data.lineInstructions).length <= CART_MAX_LINES);
export const checkoutFormSchema = checkoutFieldsSchema.extend({ name: z.string().trim().min(1, "Escribe tu nombre.").max(80), mode: modeSchema }).superRefine((data, context) => {
  if (data.mode === "delivery" && data.address.length < 5) context.addIssue({ code: "custom", path: ["address"], message: "Escribe una dirección de al menos cinco caracteres." });
});
export const validatedCartSchema = z.strictObject({
  status: z.enum(["ready", "needs_review"]), validatedAt: z.iso.datetime({ offset: true }), expiresAt: z.iso.datetime({ offset: true }), fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  mode: modeSchema, configRevision: z.number().int().positive(), whatsappE164: z.string().regex(/^\+[1-9]\d{7,14}$/), deliveryZone: publicZoneSchema.nullable(),
  warnings: z.array(z.string().max(500)), lineIssues: z.array(z.strictObject({ lineId: z.uuid(), code: z.enum(ERROR_CODES), message: z.string().max(500) })),
  lines: z.array(z.strictObject({ lineId: z.uuid(), itemId: z.uuid(), name: z.string(), portion: z.string(), quantity: z.number().int().positive(), choiceIds: choices, choices: z.array(z.string()), revision: z.number().int().positive(), unitPriceCents: cents, lineTotalCents: cents })),
  totals: z.strictObject({ subtotalCents: cents, charge: z.strictObject({ status: z.enum(["known", "pending"]), amountCents: cents.nullable() }), totalCents: cents.nullable() }),
});
