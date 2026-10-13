"use server";

import { z } from "zod";

import { hashCardKey, readCardKey } from "./card-session";
import { cardSchema, staffCardSchema } from "../validation/dto";
import { cardMutationSchema, creditSchema, incidentSchema, lookupSchema, phoneSchema, profileSchema, redeemSchema } from "../validation/schemas";
import { failure } from "@/contracts/services/result";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updatePreferencesAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const key = await readCardKey();
    if (!key) return failure({ code: "AUTH_REQUIRED", message: "Abre tu tarjeta antes de guardar indicaciones." }, requestId);
    return rpcResult(await createPrivilegedSupabaseClient().rpc("update_card_profile_by_key", {
      p_key_hash: hashCardKey(key), p_display_name: parsed.data.displayName, p_frequent_instructions: parsed.data.frequentInstructions,
      p_expected_revision: parsed.data.expectedRevision,
    }), cardSchema, requestId, true);
  }, true);
}
export async function lookupCustomerAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = phoneSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("lookup_customer", { p_phone: parsed.data }), lookupSchema, requestId);
  });
}
export async function getStaffCustomerAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = z.uuid().safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("get_staff_customer", { p_customer_id: parsed.data }), staffCardSchema, requestId);
  });
}
export async function creditStampAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = creditSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("credit_stamp", { p_customer_id: value.customerId, p_operation_id: value.operationId, p_paid_confirmed: value.paidConfirmed, p_delivered_confirmed: value.deliveredConfirmed, p_visit_reference: value.visitReference ?? undefined }), cardMutationSchema, requestId, true);
  }, true);
}
export async function redeemRewardAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = redeemSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("redeem_reward", { p_customer_id: value.customerId, p_reward_id: value.rewardId, p_operation_id: value.operationId, p_later_visit_confirmed: value.laterVisitConfirmed, p_product_available_confirmed: value.productAvailableConfirmed }), cardMutationSchema, requestId, true);
  }, true);
}
export async function openIncidentAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = incidentSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("open_incident", { p_customer_id: value.customerId, p_operation_id: value.operationId, p_type: value.type, p_description: value.description, p_reward_id: value.rewardId ?? undefined, p_source_event_id: value.sourceEventId ?? undefined }), cardMutationSchema, requestId, true);
  }, true);
}
