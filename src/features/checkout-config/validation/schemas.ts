import { z } from "zod";

const cents = z.number().int().min(0).max(2147483647);
const text = z.string().trim().min(1).max(120);
const metadata = { id: z.uuid(), revision: z.number().int().positive(), created_at: z.string(), updated_at: z.string(), deleted_at: z.string().nullable(), deleted_by: z.uuid().nullable(), delete_reason: z.string().nullable() };
export const paymentFields = z.strictObject({ code: z.string().regex(/^[a-z0-9_-]{1,80}$/), label: text, instructions: z.string().trim().min(1).max(500).nullable(), needs_change: z.boolean(), enabled: z.boolean(), verified: z.boolean(), sort_order: cents });
export const zoneFields = z.strictObject({ name: text, coverage: z.enum(["allowed", "excluded"]), fee_cents: cents.nullable(), minimum_subtotal_cents: cents.nullable(), enabled: z.boolean(), verified: z.boolean() });
export const paymentRowSchema = paymentFields.extend(metadata);
export const zoneRowSchema = zoneFields.extend(metadata);
export const checkoutConfigChangeSchema = z.strictObject({ entityType: z.enum(["payment_method", "delivery_zone"]), entityId: z.uuid(), expectedRevision: cents, configRevision: z.number().int().positive(), operationId: z.uuid(), patch: z.record(z.string(), z.unknown()) });
export const publicPaymentSchema = z.strictObject({ id: z.uuid(), code: z.string().min(1).max(80), label: text, instructions: z.string().max(500).nullable(), needsChange: z.boolean(), revision: z.number().int().positive() });
export const publicZoneSchema = z.strictObject({ id: z.uuid(), name: text, coverage: z.enum(["allowed", "excluded"]), feeCents: cents.nullable(), minimumSubtotalCents: cents.nullable(), revision: z.number().int().positive() });
