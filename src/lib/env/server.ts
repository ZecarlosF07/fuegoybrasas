import "server-only";

import { secretKeySchema, siteEnvironmentSchema } from "./schemas";
import { parseEnvironment } from "./utils";

export function getSiteEnvironment() {
  return parseEnvironment(siteEnvironmentSchema, { APP_SITE_URL: process.env.APP_SITE_URL });
}

export function getSecretKey() {
  const result = secretKeySchema.safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!result.success) throw new Error("Configuración inválida: SUPABASE_SECRET_KEY.");
  return result.data;
}
