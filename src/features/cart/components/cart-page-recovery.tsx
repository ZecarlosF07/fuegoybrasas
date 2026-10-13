"use client";

import { useEffect, useState } from "react";

import { CartFlow } from "./cart-flow";
import type { CartPageRecoveryProps } from "../types/cart";
import { AsyncButton } from "@/components/ui/async-button";
import { failure, success } from "@/contracts/services/result";
import type { Catalog } from "@/features/catalog/types/catalog";
import { catalogSchema } from "@/features/catalog/validation/schemas";

export function CartPageRecovery({ message, step }: CartPageRecoveryProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => { if (catalog) document.getElementById("contenido")?.focus(); }, [catalog]);
  async function retry() {
    const response = await fetch("/api/catalog", { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const payload = await response.json();
    const parsed = catalogSchema.safeParse(payload?.ok ? payload.data : null);
    if (!response.ok || !parsed.success) return failure({ code: "SERVICE_UNAVAILABLE", message }, crypto.randomUUID());
    setCatalog(parsed.data); return success(undefined, crypto.randomUUID());
  }
  if (catalog) return <CartFlow catalog={catalog} step={step} />;
  return <main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl space-y-4 px-4 py-8 focus:outline-none"><h1 className="font-brand text-3xl font-bold">Tu borrador está conservado</h1><p>{message}</p><AsyncButton label="Volver a consultar la carta" pendingLabel="Consultando carta…" action={retry} /></main>;
}
