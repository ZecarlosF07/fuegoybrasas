import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import "server-only";

import { createRequestSupabaseClient } from "./server";

export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createRequestSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll: (updates, headers) => {
      updates.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      if (headers) new Headers(headers).forEach((value, name) => response.headers.set(name, value));
    },
  });
  const { error } = await client.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError" && error.status !== 401 && error.status !== 403 &&
    !["refresh_token_not_found", "refresh_token_already_used", "session_not_found", "bad_jwt"].includes(error.code ?? "")) {
    return new NextResponse("No pudimos verificar el acceso. Intenta nuevamente.", {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
