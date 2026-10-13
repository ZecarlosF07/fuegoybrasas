"use client";

import { createBrowserClient } from "@supabase/ssr";

import { fetchWithoutCache } from "./fetch";
import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/types/database.types";


export function createBrowserSupabaseClient() {
  const env = getPublicEnvironment();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: fetchWithoutCache },
  });
}
