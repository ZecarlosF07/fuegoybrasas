import { redirect } from "next/navigation";
import "server-only";

import { failure } from "@/contracts/services/result";
import { staffAccessSchema } from "@/features/staff/validation/schemas";
import { rpcResult, runServerWork } from "@/lib/server/results";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getStaffAccess() {
  return runServerWork(async (requestId) => {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError" && (!error.status || error.status >= 500)) return failure({ code: "SERVICE_UNAVAILABLE", message: "El servicio de acceso no está disponible. Intenta nuevamente." }, requestId);
    if (error || !data.user) return failure({ code: "AUTH_REQUIRED", message: "Inicia sesión para continuar." }, requestId);
    return rpcResult(await client.rpc("get_staff_access"), staffAccessSchema, requestId);
  });
}

export async function requireStaffPage(manager = false) {
  const result = await getStaffAccess();
  if (!result.ok && result.error.code === "AUTH_REQUIRED") redirect("/personal/acceso");
  if (!result.ok) return result;
  if (manager && result.data.role !== "manager") return failure({ code: "FORBIDDEN", message: "Solo el responsable puede acceder a la configuración." }, result.requestId);
  return result;
}
