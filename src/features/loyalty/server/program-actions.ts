"use server";

import { getCardAccessSettings } from "./access-settings";
import { programsSchema } from "../validation/dto";
import { availabilitySchema, costSchema, programActivationSchema } from "../validation/schemas";
import { failure } from "@/contracts/services/result";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getProgramsAction() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient("action");
    return rpcResult(await client.rpc("get_loyalty_programs"), programsSchema, requestId);
  });
}
export async function activateLoyaltyProgramAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = programActivationSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    if (!getCardAccessSettings().ready) return failure({ code: "CONFIG_NOT_READY", message: "Falta aprobar las condiciones, el aviso de datos o preparar el acceso privado. El programa se conserva en borrador." }, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("activate_loyalty_program", { p_program_id: value.programId, p_expected_revision: value.expectedRevision, ...(value.costCents === null ? {} : { p_cost_cents: value.costCents }), p_terms_version: value.termsVersion, p_checks: value.checks, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
export async function setRewardAvailabilityAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = availabilitySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("set_reward_availability", { p_program_id: value.programId, p_expected_revision: value.expectedRevision, p_available: value.available, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
export async function updateRewardCostAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = costSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("update_reward_cost", { p_program_id: value.programId, p_expected_revision: value.expectedRevision, ...(value.costCents === null ? {} : { p_cost_cents: value.costCents }), p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
