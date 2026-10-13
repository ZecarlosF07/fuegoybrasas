import "server-only";

import type { EnvironmentInput } from "@/lib/env/types/environment";

export function publicIndexingAllowed(environment: EnvironmentInput) {
  return environment.APP_INDEXING_ENABLED === "true" && environment.VERCEL_ENV !== "preview"
    && environment.APP_DEPLOYMENT_TARGET === "production";
}

export function getPublicRobots() {
  const allowed = publicIndexingAllowed(process.env);
  return { index: allowed, follow: allowed };
}
