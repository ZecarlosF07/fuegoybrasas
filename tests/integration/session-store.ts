import type { ServerCookieAdapter } from "@/lib/supabase/types/cookies";

import type { SessionCookie } from "./types/session";

export function createSessionStore() {
  const cookies = new Map<string, SessionCookie>();
  const headers = new Map<string, string>();
  const adapter: ServerCookieAdapter = {
    getAll: () => [...cookies.values()],
    setAll: (updates, cacheHeaders) => {
      updates.forEach((cookie) => cookies.set(cookie.name, { name: cookie.name, value: cookie.value }));
      Object.entries(cacheHeaders).forEach(([name, value]) => headers.set(name.toLowerCase(), value));
    },
  };
  return { adapter, cookies, headers };
}
