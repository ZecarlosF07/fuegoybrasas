import "server-only";

import { customerListSchema, dashboardSchema, historySchema, incidentsSchema } from "../validation/dto";
import { customersQuerySchema, historyQuerySchema, incidentsQuerySchema, periodSchema } from "../validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboard(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = periodSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_loyalty_dashboard", { p_from: parsed.data.from, p_until: parsed.data.until }), dashboardSchema, requestId);
  });
}
export async function getCustomers(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = customersQuerySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_admin_customers", { p_filter: parsed.data.filter, p_cursor: parsed.data.cursor ?? undefined, p_limit: parsed.data.limit }), customerListSchema, requestId);
  });
}
export async function getHistory(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = historyQuerySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_customer_history", { p_customer_id: parsed.data.customerId, p_cursor: parsed.data.cursor ?? undefined, p_limit: parsed.data.limit }), historySchema, requestId);
  });
}
export async function getIncidents(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = incidentsQuerySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_loyalty_incidents", { p_status: parsed.data.status, p_cursor: parsed.data.cursor ?? undefined, p_limit: parsed.data.limit, p_include_deleted: parsed.data.includeDeleted }), incidentsSchema, requestId);
  });
}
