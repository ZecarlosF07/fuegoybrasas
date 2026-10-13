"use server";

import { checkoutConfigChangeSchema, paymentFields, zoneFields } from "../validation/schemas";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveCheckoutConfigAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = checkoutConfigChangeSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const value = parsed.data;
    const schema = value.entityType === "payment_method" ? paymentFields : zoneFields;
    const fields = (value.expectedRevision === 0 ? schema : schema.partial()).safeParse(value.patch);
    if (!fields.success) return invalidInput(fields.error, requestId);
    const key = value.entityType === "payment_method" ? "paymentMethods" : "deliveryZones";
    const patch = { [key]: [{ id: value.entityId, expectedRevision: value.expectedRevision, fields: fields.data }] };
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("update_business_config", { p_expected_revision: value.configRevision, p_patch: patch, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
