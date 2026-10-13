import { z } from "zod";

const httpUrl = z.url().refine((value) => /^https?:\/\//.test(value), {
  message: "Debe ser una URL HTTP o HTTPS.",
});
function hasLegacyRole(value: string, role: string) {
  try {
    const payload = value.split(".")[1];
    if (!payload) return false;
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return z.object({ role: z.literal(role) }).safeParse(decoded).success;
  } catch {
    // Entrada no confiable: una codificación inválida es una clave inválida.
    return false;
  }
}
const publicKey = z.string().min(20).refine(
  (value) => /^sb_publishable_[\w-]+$/.test(value) || hasLegacyRole(value, "anon"),
  { message: "Usar una clave pública válida." },
);

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
});
export const siteEnvironmentSchema = z.object({ APP_SITE_URL: httpUrl });
export const secretKeySchema = z.string().min(20).refine(
  (value) => /^sb_secret_[\w-]+$/.test(value) || hasLegacyRole(value, "service_role"),
  { message: "Usar una clave de servidor válida." },
);
