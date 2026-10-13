import { createClient } from "@supabase/supabase-js";
import "server-only";

import { STATELESS_AUTH_OPTIONS } from "./constants";
import { fetchWithoutCache } from "./fetch";
import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/types/database.types";


export function createPublicSupabaseClient() {
  const env = getPublicEnvironment();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: STATELESS_AUTH_OPTIONS,
    global: { fetch: fetchWithoutCache },
  });
}
