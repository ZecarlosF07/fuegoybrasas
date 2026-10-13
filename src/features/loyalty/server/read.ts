import { cache } from "react";
import "server-only";

import { hashCardKey, readCardKey } from "./card-session";
import { cardSchema, offerSchema, programsSchema, staffCardSchema } from "../validation/dto";
import { failure } from "@/contracts/services/result";
import { rpcResult, runServerWork } from "@/lib/server/results";
import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getMyCard = cache(async () => {
  return runServerWork(async (requestId) => {
    const key = await readCardKey();
    if (!key) return failure({ code: "AUTH_REQUIRED", message: "Crea tu tarjeta o abre su enlace privado." }, requestId);
    return rpcResult(await createPrivilegedSupabaseClient().rpc("get_card_by_key", { p_key_hash: hashCardKey(key) }), cardSchema, requestId);
  });
});
export async function getLoyaltyOffer() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_loyalty_offer"), offerSchema, requestId);
  });
}
export async function getStaffCard(customerId: string) {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_staff_customer", { p_customer_id: customerId }), staffCardSchema, requestId);
  });
}
export async function getPrograms() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient();
    return rpcResult(await client.rpc("get_loyalty_programs"), programsSchema, requestId);
  });
}
