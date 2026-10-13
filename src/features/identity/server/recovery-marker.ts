import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import "server-only";

import { RECOVERY_COOKIE, RECOVERY_DURATION_SECONDS } from "../constants";
import type { RecoveryMarker } from "../types/auth";
import { recoveryMarkerSchema } from "../validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";

function signingKey() {
  const key = process.env.STAFF_AUTH_FLOW_SECRET;
  if (!key || key.length < 32) throw new Error("Falta la configuración del flujo de recuperación.");
  return key;
}
export function signRecoveryMarker(userId: string, type: RecoveryMarker["type"], now = Date.now()) {
  const payload = recoveryMarkerSchema.parse({ userId, type, expiresAt: now + RECOVERY_DURATION_SECONDS * 1000, nonce: randomUUID() });
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", signingKey()).update(encoded).digest("base64url")}`;
}
export function verifyRecoveryMarker(value: string | undefined, userId: string, now = Date.now()) {
  if (!value) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return false;
  const expected = createHmac("sha256", signingKey()).update(payload).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const parsed = recoveryMarkerSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString()));
    return parsed.success && parsed.data.userId === userId && parsed.data.expiresAt > now && parsed.data.expiresAt <= now + RECOVERY_DURATION_SECONDS * 1000;
  } catch { return false; } // La cookie manipulada es una credencial inválida, nunca un éxito.
}
export function recoveryCookieOptions() {
  return { httpOnly: true, sameSite: "lax", secure: getSiteEnvironment().APP_SITE_URL.startsWith("https:"), path: "/personal/restablecer", maxAge: RECOVERY_DURATION_SECONDS } satisfies Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
}
export async function hasRecoveryPermission(userId: string) {
  return verifyRecoveryMarker((await cookies()).get(RECOVERY_COOKIE)?.value, userId);
}
