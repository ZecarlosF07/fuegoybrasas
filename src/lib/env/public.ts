import { publicEnvironmentSchema } from "./schemas";
import { parseEnvironment } from "./utils";

export function getPublicEnvironment() {
  // Acceso literal requerido para que Next sustituya las variables públicas.
  return parseEnvironment(publicEnvironmentSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
