import { randomUUID } from "node:crypto";
import { z } from "zod";
import "server-only";

import { writeServerEvent } from "./telemetry";
import { ERROR_CODES } from "@/contracts/error-codes";
import { failure, success } from "@/contracts/services/result";
import type { ErrorCode } from "@/contracts/types/result";
import { staffConflictSchema } from "@/features/staff/validation/schemas";
import type { OutputSchema, RpcResponse, ServerWork } from "@/lib/server/types/operation";

const errorCodeSchema = z.enum(ERROR_CODES);
const MESSAGES: Partial<Record<ErrorCode, string>> = {
  AUTH_REQUIRED: "Inicia sesión para continuar.", FORBIDDEN: "Esta cuenta no tiene acceso a esta función.",
  CONFLICT: "El registro cambió. Revisa la versión actual antes de guardar.",
  IDEMPOTENCY_CONFLICT: "Este identificador ya se usó con otros datos. Comprueba su resultado.",
  CONFIG_NOT_READY: "Esta función aún no está habilitada.", NOT_FOUND: "No encontramos el registro solicitado.",
  VALIDATION_ERROR: "Revisa los datos indicados.",
  RATE_LIMITED: "Hay muchas solicitudes en este momento. Espera un minuto y vuelve a intentarlo.",
  CUSTOMER_RECOVERY_REVIEW: "Esta tarjeta necesita revisión del responsable. No se creará otra tarjeta.",
  TERMS_CHANGED: "Las condiciones cambiaron. Revisa la versión vigente antes de activar.",
  LOYALTY_PAUSED: "La tarjeta está pausada. Conservas tu progreso y tus premios.",
  CARD_UNAVAILABLE: "Esta tarjeta no admite operaciones. Consulta al responsable.",
  DUPLICATE_VISIT_REFERENCE: "Esta referencia ya tiene un sello. Revisa el último movimiento.",
  REWARD_UNAVAILABLE: "No se puede registrar este canje. El premio permanece en la tarjeta si sigue disponible.",
  REWARD_ALREADY_REDEEMED: "Este premio ya fue canjeado. Consulta el estado actual.",
  LATER_VISIT_REQUIRED: "Confirma que el canje corresponde a una visita posterior.",
  IDENTITY_MISMATCH: "No pudimos verificar que el cambio pertenece a tu cuenta.",
};

export function rpcResult<T>(response: RpcResponse, schema: OutputSchema<T>, requestId: string, mutation = false) {
  if (!response.error) {
    const parsed = schema.safeParse(response.data);
    if (parsed.success) return success(parsed.data, requestId);
    return failure({ code: mutation ? "OPERATION_UNCERTAIN" : "SERVICE_UNAVAILABLE", message: "No pudimos comprobar el resultado. Intenta consultarlo nuevamente." }, requestId);
  }
  const code = errorCodeSchema.safeParse(response.error.message);
  if (!code.success) return failure({ code: mutation ? "OPERATION_UNCERTAIN" : "SERVICE_UNAVAILABLE", message: "No pudimos comprobar el resultado. Conserva la operación e intenta nuevamente." }, requestId);
  const conflict = parseConflict(response.error.details);
  return failure({ code: code.data, message: code.data === "CONFLICT" && conflict?.entity === "staff_account" ? "El acceso cambió o la acción dejaría al local sin responsable. Revisa antes de continuar." : MESSAGES[code.data] ?? "No se pudo completar la operación.",
    ...(code.data === "CONFLICT" && conflict ? { currentState: conflict } : {}) }, requestId);
}

function parseConflict(details?: string) {
  if (!details) return undefined;
  try { return staffConflictSchema.safeParse(JSON.parse(details)).data; }
  catch { return undefined; } // SQL no confiable: nunca mostrar su texto sin validar.
}

export async function runServerWork<T>(work: ServerWork<T>, mutation = false) {
  const requestId = randomUUID();
  const startedAt = performance.now();
  try {
    const result = await work(requestId);
    writeServerEvent({ requestId, operation: "server.work", outcome: result.ok ? "success" : result.error.code === "OPERATION_UNCERTAIN" ? "uncertain" : "failure",
      ...(result.ok ? {} : { code: result.error.code }), durationMs: performance.now() - startedAt });
    return result;
  } catch {
    const code = mutation ? "OPERATION_UNCERTAIN" : "SERVICE_UNAVAILABLE";
    writeServerEvent({ requestId, operation: "server.work", outcome: mutation ? "uncertain" : "failure", code, durationMs: performance.now() - startedAt });
    return failure({ code, message: "No pudimos comprobar el resultado. Intenta nuevamente." }, requestId);
  }
}

export function invalidInput(error: z.ZodError, requestId: string) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return failure({ code: "VALIDATION_ERROR", message: "Revisa los datos indicados.", fieldErrors }, requestId);
}
