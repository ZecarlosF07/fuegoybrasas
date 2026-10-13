import type { ServerCookieAdapter } from "@/lib/supabase/types/cookies";

export type SessionCookie = Awaited<ReturnType<ServerCookieAdapter["getAll"]>> extends (infer T)[] | null ? T : never;
export type TestIdentity = { id: string; email: string; password: string };
