"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CATALOG_UNAVAILABLE } from "../constants";
import { CatalogView } from "./catalog-view";
import { ProductDetail } from "./product-detail";
import { selectedCategorySlug } from "../services/presentation";
import type { Catalog, CatalogFailureProps } from "../types/catalog";
import { catalogSchema } from "../validation/schemas";
import { AsyncButton } from "@/components/ui/async-button";
import { failure, success } from "@/contracts/services/result";

export function CatalogRecovery({ message, productSlug, selectedSlug = "todas" }: CatalogFailureProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => { if (catalog) document.getElementById("contenido")?.focus(); }, [catalog]);
  async function retry() {
    const response = await fetch("/api/catalog", { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const body: unknown = await response.json();
    const result = catalogSchema.safeParse(typeof body === "object" && body !== null && "data" in body ? body.data : null);
    if (!response.ok || !result.success) return failure({ code: "SERVICE_UNAVAILABLE", message: CATALOG_UNAVAILABLE }, "catalog-retry");
    setCatalog(result.data);
    return success(undefined, "catalog-retry");
  }
  const safeCategory = catalog ? selectedCategorySlug(catalog, selectedSlug) : "todas";
  if (catalog && !productSlug) return <CatalogView catalog={catalog} selectedSlug={safeCategory} />;
  const item = catalog?.items.find((value) => value.slug === productSlug);
  const category = catalog?.categories.find((value) => value.id === item?.categoryId);
  if (catalog && item && category) return <ProductDetail item={item} catalog={catalog} category={category} selectedSlug={safeCategory} />;
  if (catalog) return <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-12 focus:outline-none"><h1 className="font-brand text-brand-mobile font-bold">Producto no disponible</h1><p className="my-4">Este producto ya no está en la carta.</p><Link href="/" className="inline-flex min-h-12 items-center text-brand-action underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-action">Volver a la carta</Link></main>;
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-12 focus:outline-none md:px-6 lg:px-8">
      <h1 className="font-brand text-brand-mobile font-bold">Nuestra carta</h1>
      <p role="status" className="mb-6 mt-4 max-w-xl text-brand-muted">{message}</p>
      <AsyncButton label="Volver a intentar" pendingLabel="Consultando la carta…" action={retry} />
    </main>
  );
}
