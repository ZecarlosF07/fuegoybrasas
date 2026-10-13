import type { createServerSupabaseClient } from "@/lib/supabase/server";

export type ManagementClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
