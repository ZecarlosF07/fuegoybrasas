import "server-only";

import { getPublicEnvironment } from "@/lib/env/public";
import { getSecretKey } from "@/lib/env/server";

export function getCardAccessSettings() {
  const local = ["localhost", "127.0.0.1"].includes(new URL(getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL).hostname);
  const approved = process.env.LOYALTY_TERMS_APPROVED === "true" && process.env.LOYALTY_PRIVACY_APPROVED === "true";
  // La fábrica privilegiada es exclusiva del servidor; ausencia de clave bloquea activación.
  let configured = false;
  try { configured = Boolean(getSecretKey()); } catch { configured = false; }
  return { ready: configured && (local || approved) };
}
