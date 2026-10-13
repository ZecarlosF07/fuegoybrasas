import Link from "next/link";


import { CATALOG_FOCUS_CLASSES } from "../constants";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { catalogHref } from "../services/presentation";
import type { ProductDetailProps } from "../types/catalog";
import { ProductPurchase } from "@/features/cart/components/product-purchase";
import { formatPen } from "@/lib/money/utils";

export function ProductDetail({ item, catalog, category, selectedSlug }: ProductDetailProps) {
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-8 focus:outline-none md:px-6 lg:px-8">
      <Link href={catalogHref(selectedSlug)} className={`mb-6 inline-flex min-h-12 items-center text-brand-action underline underline-offset-4 ${CATALOG_FOCUS_CLASSES}`}>Volver a la carta</Link>
      <article className="grid gap-6 md:grid-cols-2 md:gap-8">
        <ProductImage item={item} large />
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm font-semibold text-brand-gold-ink">{category.name}</p>
          <h1 className="font-brand text-brand-mobile font-bold md:text-brand-desktop">{item.name}</h1>
          {item.portionLabel && <p className="text-xl font-semibold">{item.portionLabel}</p>}
          {item.availability === "sold_out" && <p className="rounded-field border border-brand-control-border px-4 py-3 font-semibold">Agotado por ahora</p>}
          <ProductPrice item={item} />
          {item.description && <p className="text-brand-muted">{item.description}</p>}
          {item.inclusions.length > 0 && <section aria-labelledby="incluye-titulo"><h2 id="incluye-titulo" className="mb-2 text-product font-semibold">¿Qué incluye?</h2><ul className="list-inside list-disc space-y-2 text-brand-muted">{item.inclusions.map((content) => <li key={content}>{content}</li>)}</ul></section>}
          {item.prices.length > 1 && item.prices[0].priceCents !== item.prices[1].priceCents && <section aria-labelledby="precios-titulo"><h2 id="precios-titulo" className="mb-2 text-product font-semibold">Precio según modalidad</h2><dl className="space-y-2">{item.prices.map((price) => <div key={price.mode} className="flex gap-4"><dt>{price.mode === "pickup" ? "Recojo" : "Entrega"}</dt><dd>{formatPen(price.priceCents)}</dd></div>)}</dl></section>}
          {!catalog.configuration.orderingEnabled && item.optionGroups.map((group) => <section key={group.id} aria-labelledby={`grupo-${group.id}`}><h2 id={`grupo-${group.id}`} className="mb-2 text-product font-semibold">{group.name}</h2><p className="text-sm text-brand-muted">{group.minChoices > 0 ? `Elige entre ${group.minChoices} y ${group.maxChoices} opciones.` : `Hasta ${group.maxChoices} opciones, opcionales.`}</p><ul className="mt-2 list-inside list-disc space-y-2">{group.choices.map((choice) => <li key={choice.id}>{choice.label}{choice.extraPriceCents > 0 ? ` (+${formatPen(choice.extraPriceCents)})` : ""}</li>)}</ul></section>)}
          <ProductPurchase item={item} catalog={catalog} />
        </div>
      </article>
    </main>
  );
}
