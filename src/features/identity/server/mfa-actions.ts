"use server";

import { failure, success } from "@/contracts/services/result";
import { authFailure } from "@/features/identity/server/auth-error";
import { hasRecoveryPermission } from "@/features/identity/server/recovery-marker";
import { mfaSchema } from "@/features/identity/validation/schemas";
import { staffAccessSchema } from "@/features/staff/validation/schemas";
import { invalidInput, rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function enrollStaffMfaAction() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient("action");
    const user = await client.auth.getUser();
    if (user.error || !user.data.user) return failure({ code: "AUTH_REQUIRED", message: "Inicia sesión para continuar." }, requestId);
    const access = rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
    if (!access.ok) return access;
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) return authFailure(factors.error, requestId, true);
    if (factors.data.totp.length > 0) return failure({ code: "FORBIDDEN", message: "Ya existe un autenticador. Usa su código; si lo perdiste, consulta al responsable." }, requestId);
    // Solo se retiran intentos propios sin verificar. Nunca se borra un factor verificado.
    for (const factor of factors.data.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
      const removed = await client.auth.mfa.unenroll({ factorId: factor.id });
      if (removed.error) return authFailure(removed.error, requestId, true);
    }
    const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Fuego y Brasas" });
    if (enrolled.error) return authFailure(enrolled.error, requestId, true);
    return success({ factorId: enrolled.data.id, qrCode: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret }, requestId);
  });
}

export async function verifyStaffMfaAction(input: unknown) {
  return runServerWork(async (requestId) => {
    const parsed = mfaSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error, requestId);
    const client = await createServerSupabaseClient("action");
    const user = await client.auth.getUser();
    if (user.error || !user.data.user) return failure({ code: "AUTH_REQUIRED", message: "Inicia sesión para continuar." }, requestId);
    const access = rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
    if (!access.ok) return access;
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) return authFailure(factors.error, requestId, true);
    if (!factors.data.all.some((factor) => factor.factor_type === "totp" && factor.id === parsed.data.factorId)) return failure({ code: "FORBIDDEN", message: "El autenticador no pertenece a esta cuenta." }, requestId);
    const verified = await client.auth.mfa.challengeAndVerify(parsed.data);
    if (verified.error) return authFailure(verified.error, requestId, true);
    const authorized = rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
    if (!authorized.ok) return authorized;
    if (authorized.data.assuranceLevel !== "aal2") return failure({ code: "MFA_REQUIRED", message: "No pudimos confirmar la segunda verificación." }, requestId);
    return success({ destination: await hasRecoveryPermission(authorized.data.authUserId) ? "/personal/restablecer" : "/personal" }, requestId);
  });
}
