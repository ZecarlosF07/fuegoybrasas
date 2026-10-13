import { createClient } from "@supabase/supabase-js";
import "server-only";

import { STATELESS_AUTH_OPTIONS } from "./constants";
import { fetchWithoutCache } from "./fetch";
import { getPublicEnvironment } from "@/lib/env/public";
import { getSecretKey } from "@/lib/env/server";
import type { Database } from "@/types/database.types";


// Fábrica privilegiada: los futuros casos de uso deben autorizar al actor antes de llamarla.
export function createPrivilegedSupabaseClient() {
  return createClient<Database>(getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL, getSecretKey(), {
    auth: STATELESS_AUTH_OPTIONS,
    global: { fetch: fetchWithoutCache },
  });
}

export function createAdminAuthClient() { return createPrivilegedSupabaseClient().auth.admin; }
