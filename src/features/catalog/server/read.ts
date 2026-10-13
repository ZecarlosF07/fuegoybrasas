import { randomUUID } from "node:crypto";
import { cache } from "react";
import "server-only";

import { CATALOG_NOT_READY, CATALOG_REQUEST_TIMEOUT_MS, CATALOG_UNAVAILABLE } from "../constants";
import type { Catalog } from "../types/catalog";
import { catalogSchema } from "../validation/schemas";
import type { Result } from "@/contracts/types/result";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export async function readCatalog(): Promise<Result<Catalog>> {
  const requestId = randomUUID();
  try {
    const response = await createPublicSupabaseClient().rpc("read_catalog").abortSignal(AbortSignal.timeout(CATALOG_REQUEST_TIMEOUT_MS));
    if (response.error) return { ok: false, requestId, error: { code: "SERVICE_UNAVAILABLE", message: CATALOG_UNAVAILABLE } };
    if (response.data === null) return { ok: false, requestId, error: { code: "CONFIG_NOT_READY", message: CATALOG_NOT_READY } };
    const parsed = catalogSchema.safeParse(response.data);
    if (!parsed.success) {
      console.error("CATALOG_INVALID_RESPONSE", requestId);
      return { ok: false, requestId, error: { code: "SERVICE_UNAVAILABLE", message: CATALOG_UNAVAILABLE } };
    }
    return { ok: true, requestId, data: parsed.data };
  } catch {
    return { ok: false, requestId, error: { code: "SERVICE_UNAVAILABLE", message: CATALOG_UNAVAILABLE } };
  }
}
// Memoización dentro de la petición SSR (metadata y página), sin caché compartida.
export const readCatalogForPage = cache(readCatalog);
