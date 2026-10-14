"use server";

import { z } from "zod";

import { adminCatalogSchema, catalogChangeSchema, createSchemas, patchSchemas } from "../validation/schemas";
import { failure } from "@/contracts/services/result";
import { getStaffAccess } from "@/features/staff/server/access";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export async function getAdminCatalogAction(includeDeleted: unknown = false) {
  return runServerWork(async (requestId) => {
    const access = await managerAccess(requestId);
    if (access) return access;
    const parsed = z.boolean().safeParse(includeDeleted);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("get_admin_catalog", { p_include_deleted: parsed.data }), adminCatalogSchema, requestId);
  });
}
export async function updateCatalogItemAction(input: unknown) { return saveCatalogEntityAction(input); }
export async function saveCatalogEntityAction(input: unknown) {
  const result = await runServerWork(async (requestId) => {
    const access = await managerAccess(requestId);
    if (access) return access;
    const parsed = catalogChangeSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const value = parsed.data;
    const patch = (value.expectedRevision === 0 ? createSchemas[value.entityType] : patchSchemas[value.entityType]).safeParse(value.patch);
    if (!patch.success) return invalidInput(patch.error, requestId);
    if (Object.keys(patch.data).length === 0) return failure({ code: "VALIDATION_ERROR", message: "Indica un cambio." }, requestId);
    const client = await createServerSupabaseClient("action");
    const data: Json = patch.data;
    const args = { p_entity_id: value.entityId, p_expected_revision: value.expectedRevision, p_patch: data, p_operation_id: value.operationId };
    if (value.expectedRevision === 0) return rpcResult(await client.rpc("create_catalog_entity", { p_entity_type: value.entityType, p_entity_id: value.entityId, p_patch: data, p_operation_id: value.operationId }), mutationSchema, requestId, true);
    if (value.entityType === "catalog_item") return rpcResult(await client.rpc("update_catalog_item", { p_item_id: value.entityId, p_expected_revision: value.expectedRevision, p_patch: data, p_operation_id: value.operationId }), mutationSchema, requestId, true);
    const rpcNames = { category: "update_catalog_category", catalog_price: "update_catalog_price", promotion: "update_catalog_promotion", option_group: "update_catalog_option_group", option_choice: "update_catalog_option_choice" } as const;
    return rpcResult(await client.rpc(rpcNames[value.entityType], args), mutationSchema, requestId, true);
  }, true);
  if (!result.ok && result.error.code === "CONFIG_NOT_READY") return { ...result, error: { ...result.error, message: "No se puede publicar este cambio. Revisa la categoría, el contenido confirmado, los precios online y las opciones obligatorias. Puedes guardar el producto como borrador." } };
  return result;
}
async function managerAccess(requestId: string) {
  const access = await getStaffAccess();
  if (!access.ok) return failure(access.error, requestId);
  if (access.data.role !== "manager") return failure({ code: "FORBIDDEN", message: "Solo el responsable puede modificar la carta." }, requestId);
  return null;
}
