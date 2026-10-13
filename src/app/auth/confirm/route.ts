import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { RECOVERY_COOKIE } from "@/features/identity/constants";
import { recoveryCookieOptions, signRecoveryMarker } from "@/features/identity/server/recovery-marker";
import { callbackSchema } from "@/features/identity/validation/schemas";
import { staffAccessSchema } from "@/features/staff/validation/schemas";
import { getSiteEnvironment } from "@/lib/env/server";
import { createRequestSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const origin = getSiteEnvironment().APP_SITE_URL;
  const response = NextResponse.redirect(new URL("/personal/restablecer", origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  const parsed = callbackSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || request.nextUrl.searchParams.getAll("token_hash").length !== 1 || request.nextUrl.searchParams.getAll("type").length !== 1) return invalidLink(origin);
  try {
    const client = createRequestSupabaseClient({
      getAll: () => request.cookies.getAll(),
      setAll: (updates) => updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    });
    const verified = await client.auth.verifyOtp(parsed.data);
    if (verified.error || !verified.data.user) return invalidLink(origin);
    const access = await client.rpc("get_staff_access");
    if (access.error || !staffAccessSchema.safeParse(access.data).success) {
      await client.auth.signOut({ scope: "local" });
      response.headers.set("Location", new URL("/personal/acceso?estado=sin-acceso", origin).href);
      return response;
    }
    response.cookies.set(RECOVERY_COOKIE, signRecoveryMarker(verified.data.user.id, parsed.data.type), recoveryCookieOptions());
    return response;
  } catch { return new NextResponse("El servicio de acceso no está disponible. Solicita otro enlace e intenta nuevamente.", { status: 503, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); }
}
function invalidLink(origin: string) {
  return NextResponse.redirect(new URL("/personal/acceso?estado=enlace-invalido", origin), {
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
