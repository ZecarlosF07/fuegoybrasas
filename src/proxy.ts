import type { NextRequest } from "next/server";

import { refreshSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return refreshSession(request);
}

// Solo contextos de sesión; la carta pública no lee cookies ni depende de Auth.
export const config = {
  matcher: ["/personal/:path*", "/administracion/:path*", "/auth/:path*", "/api/admin/:path*"],
};
