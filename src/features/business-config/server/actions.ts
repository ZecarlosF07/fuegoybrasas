"use server";

import { failure } from "@/contracts/services/result";
import { configChangeSchema, configSchema } from "@/features/business-config/validation/schemas";
import { getCardAccessSettings } from "@/features/loyalty/server/access-settings";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminConfigAction() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("get_admin_config"), configSchema, requestId);
  });
}
export async function updateBusinessConfigAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = configChangeSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const { expectedRevision, patch, operationId } = parsed.data;
    if (patch.loyaltyEnabled && !getCardAccessSettings().ready) return failure({ code: "CONFIG_NOT_READY", message: "Confirma el acceso privado, las condiciones y la privacidad antes de reanudar la tarjeta." }, requestId);
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("update_business_config", { p_expected_revision: expectedRevision, p_patch: patch, p_operation_id: operationId }), mutationSchema, requestId, true);
  }, true);
}
