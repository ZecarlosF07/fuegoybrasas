import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import "server-only";

import { fetchWithoutCache } from "./fetch";
import type { CookieWriteContext, ServerCookieAdapter } from "./types/cookies";
import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/types/database.types";


export function createRequestSupabaseClient(adapter: ServerCookieAdapter) {
  const env = getPublicEnvironment();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: adapter,
    global: { fetch: fetchWithoutCache },
  });
}

export async function createServerSupabaseClient(context: CookieWriteContext = "render") {
  const store = await cookies();
  return createRequestSupabaseClient({
    getAll: () => store.getAll(),
    setAll: (updates) => {
      if (updates.length === 0) return;
      if (context === "render") {
        throw new Error("La sesión requiere renovación en Proxy antes de renderizar.");
      }
      updates.forEach(({ name, value, options }) => store.set(name, value, options));
    },
  });
}
