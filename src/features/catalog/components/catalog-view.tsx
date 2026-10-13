import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { BusinessInfo } from "./business-info";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { ProductPrice } from "./product-price";
import { productHref } from "../services/presentation";
import type { CatalogViewProps } from "../types/catalog";

export function CatalogView({ catalog, selectedSlug = "todas" }: CatalogViewProps) {
  const selected = catalog.categories.find((category) => category.slug === selectedSlug);
  const currentSlug = selected?.slug ?? "todas";
  const categories = selected ? [selected] : catalog.categories;
  const featured = catalog.items.find((item) => item.kind === "promotion" && item.availability === "available");
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-8 focus:outline-none md:px-6 lg:px-8">
      <div className="grid gap-6 pb-8 md:grid-cols-2 md:items-center">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm font-semibold text-brand-gold-ink">Pollo a la brasa · Parcona</p>
          <h1 className="max-w-lg font-brand text-brand-mobile font-bold md:text-brand-desktop">Sabor que une,<br />momentos que quedan.</h1>
          <p className="max-w-lg text-brand-muted">Nuestra carta, tus favoritos. Encuentra el plato que te provoca y conoce qué incluye.</p>
          <BusinessInfo catalog={catalog} />
        </div>
        {featured && <aside aria-label="Promoción destacada" className="rounded-card border border-brand-border bg-brand-surface p-6">
          <p className="mb-3 text-sm font-semibold text-brand-gold-ink">En promoción</p>
          <h2 className="font-brand text-section-mobile font-semibold">{featured.name}</h2>
          <p className="mt-2 font-medium">{featured.portionLabel}</p>
          <p className="mb-4 mt-2 text-brand-muted">{featured.inclusions.join(" · ")}</p>
          <ProductPrice item={featured} />
          <Link href={productHref(featured, currentSlug)} className={`mt-4 inline-flex min-h-12 items-center font-semibold text-brand-action underline underline-offset-4 ${CATALOG_FOCUS_CLASSES}`}>Conocer esta promoción</Link>
        </aside>}
      </div>
      <section id="carta" aria-labelledby="carta-titulo" className="scroll-mt-4">
        <h2 id="carta-titulo" className="mb-4 text-section-mobile font-bold md:text-section-desktop">Nuestra carta</h2>
        {catalog.items.length === 0 ? <div className="rounded-card border border-brand-border bg-brand-surface p-6"><p>Estamos preparando nuestra carta.</p><p className="mt-2 text-brand-muted">Vuelve a consultarla pronto para conocer nuestros platos y promociones.</p></div> : <>
          <CategoryNav categories={catalog.categories} selectedSlug={currentSlug} />
          {categories.map((category) => <section key={category.id} aria-labelledby={`categoria-${category.slug}`} className="mt-6">
            <h2 id={`categoria-${category.slug}`} className="mb-4 text-section-mobile font-bold">{category.name}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {catalog.items.filter((item) => item.categoryId === category.id).map((item) => <ProductCard key={item.id} item={item} selectedSlug={currentSlug} />)}
            </div>
          </section>)}
        </>}
      </section>
    </main>
  );
}
