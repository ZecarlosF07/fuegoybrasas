import type { CookieMethodsServer } from "@supabase/ssr";

export type ServerCookieAdapter = Required<Pick<CookieMethodsServer, "getAll" | "setAll">>;
export type CookieWriteContext = "render" | "action";
