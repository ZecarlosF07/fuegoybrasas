"use server";

import { getCustomers, getDashboard, getHistory, getIncidents } from "./reads";
import { closeIncidentSchema, correctionSchema, reverseSchema } from "../validation/schemas";
import { mutationSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardAction(input: unknown) { return getDashboard(input); }
export async function getCustomersAction(input: unknown) { return getCustomers(input); }
export async function getHistoryAction(input: unknown) { return getHistory(input); }
export async function getIncidentsAction(input: unknown) { return getIncidents(input); }
export async function reverseStampAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = reverseSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("reverse_stamp", { p_customer_id: value.customerId, p_event_id: value.eventId, p_reason: value.reason, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
export async function correctCustomerProfileAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = correctionSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("correct_customer_profile", { p_customer_id: value.customerId, p_expected_revision: value.expectedRevision, p_display_name: value.displayName,
      p_frequent_instructions: value.frequentInstructions, p_customer_request_confirmed: value.customerRequestConfirmed, p_reason: value.reason, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
export async function closeIncidentAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = closeIncidentSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const value = parsed.data;
    return rpcResult(await client.rpc("close_incident", { p_incident_id: value.incidentId, p_expected_revision: value.expectedRevision, p_resolution_note: value.resolutionNote, p_operation_id: value.operationId }), mutationSchema, requestId, true);
  }, true);
}
