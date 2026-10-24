import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { catalogHref } from "../services/presentation";
import type { ProductDetailProps } from "../types/catalog";
import { ProductPurchase } from "@/features/cart/components/product-purchase";

export function ProductDetail({ item, catalog, category, selectedSlug }: ProductDetailProps) {
  return <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-6 focus:outline-none md:px-6 md:py-8 lg:px-8">
    <nav aria-label="Ubicación en la carta" className="mb-5 flex flex-wrap items-center gap-x-3 text-sm text-brand-muted">
      <Link href={catalogHref(selectedSlug)} className={"inline-flex min-h-12 items-center gap-2 font-semibold text-brand-action " + CATALOG_FOCUS_CLASSES}><span aria-hidden="true">←</span> Volver a la carta</Link><span aria-hidden="true">/</span><span>{category.name}</span>
    </nav>
    <article className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
      <div className="md:sticky md:top-6">
        <ProductImage item={item} large />
      </div>
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-brand-action">{category.name}</p>{item.kind === "promotion" && <p className="rounded-field bg-brand-action px-3 py-1 text-sm font-semibold text-brand-surface">En promoción</p>}</div>
          <h1 className="font-brand text-brand-mobile font-bold md:text-brand-desktop">{item.name}</h1>
          {item.portionLabel && <p className="text-xl text-brand-muted">{item.portionLabel}</p>}
          {item.availability === "sold_out" && <p className="inline-flex rounded-field border border-brand-control-border px-3 py-2 font-semibold">Agotado por ahora</p>}
          <ProductPrice item={item} />
          {item.description && <p className="leading-7 text-brand-muted">{item.description}</p>}
        </div>
        {item.inclusions.length > 0 && <section aria-labelledby="incluye-titulo" className="border-y border-brand-border py-5"><h2 id="incluye-titulo" className="mb-4 text-product font-semibold">¿Qué incluye?</h2><ul className="grid gap-3 sm:grid-cols-2">{item.inclusions.map((content) => <li key={content} className="flex items-start gap-3"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="mt-1 size-4 shrink-0 text-brand-action"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{content}</span></li>)}</ul></section>}
        <ProductPurchase item={item} catalog={catalog} />
        <Link href={catalogHref(category.slug)} className={"inline-flex min-h-12 items-center gap-2 font-semibold text-brand-action underline underline-offset-4 " + CATALOG_FOCUS_CLASSES}>Ver más de {category.name.toLowerCase()} <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  </main>;
}
