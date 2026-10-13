"use server";

import { deriveRecoveredCardKey } from "./recovery-key";
import { contingencySchema, recoverSchema, reinstateSchema } from "../validation/schemas";
import { failure, success } from "@/contracts/services/result";
import { hashCardKey } from "@/features/loyalty/server/card-session";
import { createPrivateCardLink } from "@/features/loyalty/server/private-link";
import { getStaffAccess } from "@/features/staff/server/access";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function reinstateRewardAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = reinstateSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const value = parsed.data; const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("reinstate_reward", { p_incident_id: value.incidentId, p_expected_revision: value.expectedRevision, p_not_delivered_confirmed: value.notDeliveredConfirmed, p_reason: value.reason, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
export async function recoverCardAccessAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = recoverSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const access = await getStaffAccess();
    if (!access.ok) return access;
    if (access.data.role !== "manager" || access.data.assuranceLevel !== "aal2") return failure({ code: "FORBIDDEN", message: "Solo el responsable con MFA recupera tarjetas presencialmente." }, requestId);
    const value = parsed.data;
    const key = deriveRecoveredCardKey(access.data.authUserId, value.customerId, value.operationId);
    const client = await createServerSupabaseClient("action");
    const result = rpcResult(await client.rpc("recover_card_access", { p_customer_id: value.customerId, p_expected_revision: value.expectedRevision, p_new_key_hash: hashCardKey(key),
      p_reference: value.reference, p_history_event_id: value.historyEventId, p_in_person_confirmed: value.inPersonConfirmed, p_identity_checked_confirmed: value.identityCheckedConfirmed, p_reason: value.reason, p_operation_id: value.operationId }), mutationSchema, requestId, true);
    if (!result.ok) return result;
    return success({ ...result.data, privateLink: await createPrivateCardLink(key) }, requestId);
  }, true);
}
export async function creditContingencyAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = contingencySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const value = parsed.data; const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("credit_contingency_stamp", { p_customer_id: value.customerId, p_occurred_at: value.occurredAt, p_visit_reference: value.visitReference, p_reason: value.reason,
      p_paid_confirmed: value.paidConfirmed, p_delivered_confirmed: value.deliveredConfirmed, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
