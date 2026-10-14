"use server";

import { cookies } from "next/headers";

import { failure, success } from "@/contracts/services/result";
import { PRIVATE_CHECKOUT_KEY, RECOVERY_COOKIE } from "@/features/identity/constants";
import { authFailure } from "@/features/identity/server/auth-error";
import { hasRecoveryPermission, recoveryCookieOptions } from "@/features/identity/server/recovery-marker";
import { loginSchema, passwordSchema, recoverySchema } from "@/features/identity/validation/schemas";
import { staffAccessSchema } from "@/features/staff/validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signInStaffAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error) return authFailure(error, requestId);
    const access = rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
    if (!access.ok) return access;
    return success({ destination: "/personal" }, requestId);
  });
}

export async function requestPasswordRecoveryAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = recoverySchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const { error } = await client.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: new URL("/auth/confirm", getSiteEnvironment().APP_SITE_URL).href,
    });
    if (error && (error.status === 429 || (error.status ?? 0) >= 500)) return authFailure(error, requestId);
    // Respuesta idéntica para correos existentes, ajenos o desconocidos.
    return success({ message: "Si la cuenta puede recuperar su acceso, recibirá un correo con las instrucciones." }, requestId);
  });
}

export async function completePasswordAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || !await hasRecoveryPermission(data.user.id)) return failure({ code: "AUTH_REQUIRED", message: "El enlace ya no es válido. Solicita otro correo de recuperación." }, requestId);
    const access = rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
    if (!access.ok) return access;
    const changed = await client.auth.updateUser({ password: parsed.data.password });
    if (changed.error) return authFailure(changed.error, requestId);
    (await cookies()).set(RECOVERY_COOKIE, "", { ...recoveryCookieOptions(), maxAge: 0 });
    return success({ destination: "/personal" }, requestId);
  });
}

export async function signOutStaffAction() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient("action");
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) return authFailure(error, requestId);
    (await cookies()).set(RECOVERY_COOKIE, "", { ...recoveryCookieOptions(), maxAge: 0 });
    return success({ privateCheckoutKey: PRIVATE_CHECKOUT_KEY }, requestId);
  });
}
