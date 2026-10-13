import { z } from "zod";

import { CATALOG_ENTITY_TYPES } from "../constants";

const text = z.string().trim().min(1).max(120);
const slug = z.string().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa letras minúsculas, números y guiones.");
const integer = z.number().int().min(0).max(2147483647);
const money = integer.min(1);
const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable();
const common = { revision: z.number().int().positive(), created_at: z.string(), updated_at: z.string(), deleted_at: z.string().nullable(), deleted_by: z.uuid().nullable(), delete_reason: z.string().nullable() };
export const categoryFields = z.strictObject({ slug, name: text, sort_order: integer, active: z.boolean() });
export const itemFields = z.strictObject({ slug, name: text, kind: z.enum(["regular", "promotion"]), portion_label: nullableText(80), inclusions: z.array(z.string().trim().min(1).max(120)).max(12), description: nullableText(500), image_path: z.string().max(512).nullable(), online_enabled: z.boolean(), content_verified: z.boolean(), publication_status: z.enum(["draft", "published", "archived"]), availability: z.enum(["available", "sold_out"]), sort_order: integer });
export const priceFields = z.strictObject({ price_cents: money, verified: z.boolean() });
export const promotionFields = z.strictObject({ enabled: z.boolean(), starts_at: z.iso.datetime({ offset: true }).nullable(), ends_at: z.iso.datetime({ offset: true }).nullable(), weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7).refine((days) => new Set(days).size === days.length).nullable(), previous_price_cents: money.nullable(), comparison_verified: z.boolean() });
export const groupFields = z.strictObject({ name: text, min_choices: integer, max_choices: integer.min(1), active: z.boolean(), verified: z.boolean(), sort_order: integer });
export const choiceFields = z.strictObject({ label: text, extra_price_cents: integer, available: z.boolean(), verified: z.boolean(), sort_order: integer });
export const patchSchemas = { category: categoryFields.partial(), catalog_item: itemFields.partial(), catalog_price: priceFields.partial(), promotion: promotionFields.partial(), option_group: groupFields.partial(), option_choice: choiceFields.partial() };
export const createSchemas = { category: categoryFields, catalog_item: itemFields.extend({ category_id: z.uuid() }), catalog_price: priceFields.extend({ item_id: z.uuid(), mode: z.enum(["delivery", "pickup", "dine_in"]) }), promotion: promotionFields, option_group: groupFields.extend({ item_id: z.uuid() }), option_choice: choiceFields.extend({ group_id: z.uuid() }) };
export const adminCatalogSchema = z.strictObject({
  categories: z.array(categoryFields.extend({ ...common, id: z.uuid() })),
  items: z.array(itemFields.extend({ ...common, id: z.uuid(), category_id: z.uuid(), source_ref: z.string().nullable(), source_price_cents: integer.nullable() })),
  prices: z.array(priceFields.extend({ ...common, id: z.uuid(), item_id: z.uuid(), mode: z.enum(["delivery", "pickup", "dine_in"]) })),
  promotions: z.array(promotionFields.extend({ ...common, item_id: z.uuid() })),
  groups: z.array(groupFields.extend({ ...common, id: z.uuid(), item_id: z.uuid() })),
  choices: z.array(choiceFields.extend({ ...common, id: z.uuid(), group_id: z.uuid() })),
});
export const catalogChangeSchema = z.strictObject({ entityType: z.enum(CATALOG_ENTITY_TYPES), entityId: z.uuid(), expectedRevision: integer, operationId: z.uuid(), patch: z.record(z.string(), z.unknown()) });
export const imagePathSchema = z.string().regex(/^items\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/).max(512);
export const imageUploadSchema = z.strictObject({ itemId: z.uuid(), uploadId: z.uuid() });
export const cleanupSchema = z.strictObject({ imagePath: imagePathSchema, operationId: z.uuid() });
export const uploadResponseSchema = z.strictObject({ imagePath: imagePathSchema });
