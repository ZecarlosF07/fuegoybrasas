import { z } from "zod";

import { CATALOG_ENTITY_TYPES } from "@/features/catalog-admin/constants";
import { staffCardSchema } from "@/features/loyalty/validation/dto";

export const staffAccessSchema = z.object({
  id: z.uuid(), authUserId: z.uuid(), role: z.enum(["attendant", "manager"]),
  revision: z.number().int().positive(), assuranceLevel: z.enum(["aal1", "aal2"]),
});
export const staffConflictSchema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("card"), value: staffCardSchema.nullable() }),
  z.object({ entity: z.literal("loyalty_program"), id: z.uuid(), revision: z.number().int().positive() }),
  z.object({ entity: z.literal("business_config"), revision: z.number().int().positive() }),
  z.object({ entity: z.literal("staff_account"), id: z.uuid(), revision: z.number().int().positive(), active: z.boolean().optional(), deleted: z.boolean().optional() }),
  z.object({ entity: z.enum(["payment_method", "delivery_zone", ...CATALOG_ENTITY_TYPES]), id: z.uuid(), revision: z.number().int().positive(), deleted: z.boolean().optional() }),
  z.object({ entity: z.literal("catalog_image"), revision: z.number().int().positive() }),
  z.object({ entity: z.enum(["customer", "loyalty_incident", "loyalty_reward"]), id: z.uuid(), revision: z.number().int().positive(), deleted: z.boolean().optional() }),
  z.object({ entity: z.literal("staff_invitation"), id: z.uuid(), revision: z.number().int().positive(), state: z.enum(["reserved", "pending", "sent", "ready"]) }),
]);
export const mutationSchema = z.object({
  operationId: z.uuid(), replayed: z.boolean(), outcome: z.enum(["applied", "review_required"]),
  entityType: z.enum(["business_config", "staff_account", "staff_invitation", "catalog_image", "payment_method", "delivery_zone", "loyalty_card", "loyalty_program", "customer", "loyalty_incident", "loyalty_reward", ...CATALOG_ENTITY_TYPES]), entityId: z.string(), revision: z.number().int().positive(),
});
export const operationSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_found"), operationId: z.uuid() }),
  z.object({ status: z.literal("recorded"), operationId: z.uuid(), operationKind: z.string(),
    result: mutationSchema, currentState: staffConflictSchema }),
]);
export const staffChangeSchema = z.strictObject({
  staffId: z.uuid(), expectedRevision: z.number().int().positive(), operationId: z.uuid(),
  patch: z.strictObject({ role: z.enum(["attendant", "manager"]).optional(), active: z.boolean().optional() })
    .refine((patch) => Object.keys(patch).length > 0, "Indica un cambio."),
});
export const conservationSchema = z.strictObject({
  entityType: z.enum(["staff_account", "payment_method", "delivery_zone", "customer", "loyalty_card", "loyalty_program", "loyalty_incident", "loyalty_reward", ...CATALOG_ENTITY_TYPES]), entityId: z.uuid(), expectedRevision: z.number().int().positive(),
  operationId: z.uuid(), reason: z.string().trim().min(10).max(500),
});
