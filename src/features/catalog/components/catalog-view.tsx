import { CatalogHero } from "./catalog-hero";
import { CatalogVisit } from "./catalog-visit";
import { CategoryHighlights } from "./category-highlights";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { visibleCategoryItems } from "../services/media";
import { selectedCategorySlug } from "../services/presentation";
import type { CatalogViewProps } from "../types/catalog";

export function CatalogView({ catalog, selectedSlug = "todas" }: CatalogViewProps) {
  const currentSlug = selectedCategorySlug(catalog, selectedSlug);
  const sections = visibleCategoryItems(catalog, currentSlug);
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 pb-8 pt-4 focus:outline-none md:px-6 md:pt-6 lg:px-8">
      {currentSlug === "todas" ? <><CatalogHero /><CategoryHighlights catalog={catalog} /></> : <h1 className="mb-6 mt-4 font-brand text-brand-mobile font-bold md:text-brand-desktop">{sections[0]?.category.name ?? "Nuestra carta"}</h1>}
      <section id="carta" aria-labelledby="carta-titulo" className="scroll-mt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><p className="mb-2 text-sm font-semibold text-brand-gold-ink">Hecha para tus antojos</p><h2 id="carta-titulo" className="text-section-mobile font-bold md:text-section-desktop">Nuestra carta</h2></div>
          <p className="text-sm text-brand-muted">Porciones, inclusiones y precios en cada plato.</p>
        </div>
        {catalog.items.length === 0 ? <div className="rounded-card border border-brand-border bg-brand-surface p-6"><p>Estamos preparando nuestra carta.</p><p className="mt-2 text-brand-muted">Vuelve a consultarla pronto para conocer nuestros platos y promociones.</p></div> : <>
          <CategoryNav categories={catalog.categories} selectedSlug={currentSlug} />
          {sections.map(({ category, items }) => <section key={category.id} aria-labelledby={`categoria-${category.slug}`} className="mt-8 md:mt-12">
            <div className="mb-5 flex items-center gap-4"><h2 id={`categoria-${category.slug}`} className="text-section-mobile font-bold">{category.name}</h2><span aria-hidden="true" className="h-px flex-1 bg-brand-border" /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {items.map((item) => <ProductCard key={item.id} item={item} selectedSlug={currentSlug} />)}
            </div>
          </section>)}
        </>}
      </section>
      <CatalogVisit catalog={catalog} />
    </main>
  );
}
