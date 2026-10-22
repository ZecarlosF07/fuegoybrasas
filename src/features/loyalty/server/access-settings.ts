import "server-only";

import approval from "@/features/loyalty/config/documents-approval.json";
import { LOYALTY_TERMS_VERSION } from "@/features/loyalty/constants";
import { getPublicEnvironment } from "@/lib/env/public";
import { getSecretKey } from "@/lib/env/server";

export function getCardAccessSettings() {
  const local = ["localhost", "127.0.0.1"].includes(new URL(getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL).hostname);
  const approved = approval.approved && approval.termsVersion === LOYALTY_TERMS_VERSION;
  // La fábrica privilegiada es exclusiva del servidor; ausencia de clave bloquea activación.
  let configured = false;
  try { configured = Boolean(getSecretKey()); } catch { configured = false; }
  return { ready: configured && (local || approved) };
}
