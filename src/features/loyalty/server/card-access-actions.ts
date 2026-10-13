"use server";

import { getCardAccessSettings } from "./access-settings";
import { clearCardKey, createCardKey, hashCardKey, readCardKey, saveCardKey } from "./card-session";
import { createPrivateCardLink } from "./private-link";
import { cardSchema } from "../validation/dto";
import { cardKeySchema, changeContactSchema, registerCardSchema } from "../validation/schemas";
import { failure, success } from "@/contracts/services/result";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";

export async function registerCardAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = registerCardSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    if (!getCardAccessSettings().ready) return failure({ code: "CONFIG_NOT_READY", message: "La tarjeta aún no está habilitada. Puedes pedir como invitado." }, requestId);
    const key = await readCardKey() ?? createCardKey();
    // Conservar la misma clave ante respuesta perdida; el alta por hash es idempotente.
    await saveCardKey(key);
    const value = parsed.data;
    return rpcResult(await createPrivilegedSupabaseClient().rpc("ensure_card_by_key", {
      p_key_hash: hashCardKey(key), p_display_name: value.displayName, p_phone: value.phone,
      p_terms_version: value.termsVersion, p_terms_accepted: value.termsAccepted,
    }), cardSchema, requestId, true);
  }, true);
}
export async function openCardLinkAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = cardKeySchema.safeParse(input);
    if (!parsed.success) return failure({ code: "AUTH_REQUIRED", message: "El enlace de tarjeta no es válido." }, requestId);
    const result = rpcResult(await createPrivilegedSupabaseClient().rpc("get_card_by_key", { p_key_hash: hashCardKey(parsed.data) }), cardSchema, requestId);
    if (!result.ok) return result;
    await saveCardKey(parsed.data);
    return success({ destination: "/mi-tarjeta" }, requestId);
  });
}
export async function getPrivateCardLinkAction() {
  return runServerWork(async (requestId) => {
    const key = await readCardKey();
    if (!key) return failure({ code: "AUTH_REQUIRED", message: "Abre tu tarjeta antes de guardar su enlace." }, requestId);
    const result = rpcResult(await createPrivilegedSupabaseClient().rpc("get_card_by_key", { p_key_hash: hashCardKey(key) }), cardSchema, requestId);
    if (!result.ok) return result;
    return success(await createPrivateCardLink(key), requestId);
  });
}
export async function changeCardContactAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = changeContactSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const key = await readCardKey();
    if (!key) return failure({ code: "AUTH_REQUIRED", message: "Abre tu tarjeta antes de cambiar el contacto." }, requestId);
    return rpcResult(await createPrivilegedSupabaseClient().rpc("update_card_phone_by_key", {
      p_key_hash: hashCardKey(key), p_phone: parsed.data.phone, p_expected_revision: parsed.data.expectedRevision,
    }), cardSchema, requestId, true);
  }, true);
}
export async function forgetCardAction() {
  return runServerWork(async (requestId) => {
    await clearCardKey();
    return success(undefined, requestId);
  });
}
