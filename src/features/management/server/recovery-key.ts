import { createHmac } from "node:crypto";
import "server-only";

export function deriveRecoveredCardKey(actorId: string, customerId: string, operationId: string) {
  const secret = process.env.STAFF_AUTH_FLOW_SECRET;
  if (!secret || secret.length < 32) throw new Error("Falta la configuración privada de recuperación.");
  // Derivación con propósito separado: mismo UUID recupera la misma clave sin guardarla en recibos.
  return createHmac("sha256", secret).update(`fyb:card-recovery:v1:${actorId}:${customerId}:${operationId}`).digest("hex");
}
