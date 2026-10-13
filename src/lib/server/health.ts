import "server-only";

import { HEALTH_OK, HEALTH_UNAVAILABLE, MINIMUM_FLOW_SECRET_LENGTH } from "./constants";
import type { HealthResult } from "./types/health";
import { publicEnvironmentSchema, secretKeySchema, siteEnvironmentSchema } from "@/lib/env/schemas";
import type { EnvironmentInput } from "@/lib/env/types/environment";

export function inspectRuntimeHealth(environment: EnvironmentInput): HealthResult {
  const candidate = environment.APP_RELEASE_ID || environment.VERCEL_GIT_COMMIT_SHA || "";
  const release = /^[a-f0-9]{40}$/.test(candidate) ? candidate : "unversioned";
  const configured = publicEnvironmentSchema.safeParse(environment).success && siteEnvironmentSchema.safeParse(environment).success
    && secretKeySchema.safeParse(environment.SUPABASE_SECRET_KEY).success
    && (environment.STAFF_AUTH_FLOW_SECRET?.length ?? 0) >= MINIMUM_FLOW_SECRET_LENGTH;
  return { body: { status: configured ? "ok" : "unavailable", release }, status: configured ? HEALTH_OK : HEALTH_UNAVAILABLE };
}
