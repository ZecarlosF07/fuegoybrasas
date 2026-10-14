import "server-only";

import { failure } from "@/contracts/services/result";

export function authFailure(error: { status?: number; code?: string }, requestId: string) {
  if (error.status === 429) return failure({ code: "RATE_LIMITED", message: "Hubo demasiados intentos. Espera antes de volver a intentar.", retryAfterSeconds: 60 }, requestId);
  if ((error.status ?? 0) >= 500) return failure({ code: "SERVICE_UNAVAILABLE", message: "El servicio de acceso no está disponible. Intenta nuevamente." }, requestId);
  return failure({ code: "AUTH_REQUIRED", message: "No pudimos verificar el acceso. Revisa tus datos." }, requestId);
}
