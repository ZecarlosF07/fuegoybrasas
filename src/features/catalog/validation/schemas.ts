import { z } from "zod";

import { openingPeriodSchema } from "@/features/business-config/validation/schemas";
import { publicPaymentSchema, publicZoneSchema } from "@/features/checkout-config/validation/schemas";

const revision = z.number().int().positive();
const cents = z.number().int().nonnegative().max(2_147_483_647);
const label = z.string().trim().min(1).max(120);
export const catalogSlugSchema = z.string().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const priceSchema = z.strictObject({ mode: z.enum(["delivery", "pickup"]), priceCents: cents.refine((value) => value > 0), revision });
const choiceSchema = z.strictObject({ id: z.uuid(), label, extraPriceCents: cents, revision });
const groupSchema = z.strictObject({
  id: z.uuid(), name: label, minChoices: z.number().int().nonnegative(), maxChoices: z.number().int().positive(),
  revision, choices: z.array(choiceSchema).min(1),
}).refine((group) => group.maxChoices >= group.minChoices && group.choices.length >= group.minChoices);
const promotionSchema = z.strictObject({
  startsAt: z.iso.datetime({ offset: true }).nullable(), endsAt: z.iso.datetime({ offset: true }).nullable(),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7).nullable(), previousPriceCents: cents.nullable(),
});
export const catalogItemSchema = z.strictObject({
  id: z.uuid(), categoryId: z.uuid(), slug: catalogSlugSchema, name: label, kind: z.enum(["regular", "promotion"]),
  portionLabel: z.string().min(1).max(80).nullable(), inclusions: z.array(label).max(12),
  description: z.string().min(1).max(500).nullable(), imagePath: z.string().max(512).nullable(),
  availability: z.enum(["available", "sold_out"]), revision, prices: z.array(priceSchema).min(1).max(2),
  optionGroups: z.array(groupSchema), promotion: promotionSchema.nullable(),
}).refine((item) => item.imagePath === null || new RegExp(`^items/${item.id}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`).test(item.imagePath))
  .refine((item) => new Set(item.prices.map((price) => price.mode)).size === item.prices.length)
  .refine((item) => (item.kind === "promotion") === (item.promotion !== null));
export const catalogConfigSchema = z.strictObject({
  revision, displayName: label, whatsappE164: z.string().regex(/^\+[1-9]\d{7,14}$/), timezone: z.literal("America/Lima"),
  orderingEnabled: z.boolean(), loyaltyEnabled: z.boolean(), locationVerified: z.boolean(),
  address: z.string().max(250).nullable(), mapsUrl: z.url().nullable(), scheduleConfirmed: z.boolean(),
  openingPeriods: z.array(openingPeriodSchema), pickupChargesVerified: z.boolean(), pickupExtraCents: cents.nullable(),
  paymentMethods: z.array(publicPaymentSchema), deliveryZones: z.array(publicZoneSchema), paymentsReady: z.boolean(), deliveryZonesReady: z.boolean(),
});
export const catalogSchema = z.strictObject({
  serverNow: z.iso.datetime({ offset: true }), configuration: catalogConfigSchema,
  categories: z.array(z.strictObject({ id: z.uuid(), slug: catalogSlugSchema, name: label, revision })),
  items: z.array(catalogItemSchema),
}).refine((catalog) => {
  const categoryIds = new Set(catalog.categories.map((category) => category.id));
  return catalog.items.every((item) => categoryIds.has(item.categoryId));
});
