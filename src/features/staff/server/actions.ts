"use server";

import { z } from "zod";

import { conservationSchema, mutationSchema, operationSchema, staffChangeSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getOperationAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = z.uuid().safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("get_operation", { p_operation_id: parsed.data }), operationSchema, requestId);
  });
}

export async function updateStaffAccessAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = staffChangeSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const { staffId, expectedRevision, patch, operationId } = parsed.data;
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("update_staff_access", { p_staff_id: staffId, p_expected_revision: expectedRevision, p_patch: patch, p_operation_id: operationId }), mutationSchema, requestId, true);
  }, true);
}

export async function softDeleteEntityAction(input: unknown) { return conserve(input, false); }
export async function restoreEntityAction(input: unknown) { return conserve(input, true); }

async function conserve(input: unknown, restoring: boolean) {
  return runServerWork(async (requestId) => {
    const parsed = conservationSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const value = parsed.data;
    const client = await createServerSupabaseClient("action");
    const response = await client.rpc(restoring ? "restore_entity" : "soft_delete_entity", {
      p_entity_type: value.entityType, p_entity_id: value.entityId, p_expected_revision: value.expectedRevision,
      p_reason: value.reason, p_operation_id: value.operationId,
    });
    return rpcResult(response, mutationSchema, requestId, true);
  }, true);
}
