import { z } from "zod";

import { clockMinutes, hasScheduleOverlap } from "../services/schedule";
import { paymentRowSchema, zoneRowSchema } from "@/features/checkout-config/validation/schemas";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa un horario válido.");
export const openingPeriodSchema = z.strictObject({
  day: z.number().int().min(1).max(7), opensAt: time, closesAt: time, closesNextDay: z.boolean(),
}).refine((period) => clockMinutes(period.closesAt) + Number(period.closesNextDay) * 1440 > clockMinutes(period.opensAt), "El cierre debe ser posterior al inicio.");
const periodsSchema = z.array(openingPeriodSchema).max(28).refine((periods) => !hasScheduleOverlap(periods), "Los horarios no pueden superponerse.");
const nullableText = z.string().trim().min(1).max(250).nullable();
const mapsUrl = z.string().trim().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      (["maps.app.goo.gl", "maps.google.com"].includes(url.hostname) || (["www.google.com", "google.com"].includes(url.hostname) && url.pathname.startsWith("/maps")));
  } catch { return false; }
}, "Usa un enlace HTTPS de Google Maps.").nullable();
export const configFieldsSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(120), whatsappE164: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Incluye el código de país, por ejemplo +51982042493."),
  timezone: z.literal("America/Lima"), address: nullableText, mapsUrl,
  locationVerified: z.boolean(), scheduleConfirmed: z.boolean(), openingPeriods: periodsSchema,
  pickupExtraCents: z.number().int().min(0).max(100000).nullable(), pickupChargesVerified: z.boolean(),
  orderingEnabled: z.boolean(), loyaltyEnabled: z.boolean(),
});
export const configSchema = configFieldsSchema.extend({ revision: z.number().int().positive(), paymentMethods: z.array(paymentRowSchema).default([]), deliveryZones: z.array(zoneRowSchema).default([]) });
export const configChangeSchema = z.strictObject({
  expectedRevision: z.number().int().positive(), operationId: z.uuid(),
  patch: configFieldsSchema.partial().refine((patch) => Object.keys(patch).length > 0, "Indica un cambio."),
});
