import "server-only";

import { getSiteEnvironment } from "@/lib/env/server";

export function hasExpectedOrigin(request: Request, required = true) {
  const origin = request.headers.get("origin");
  if (!origin) return !required;
  return origin === new URL(getSiteEnvironment().APP_SITE_URL).origin;
}
