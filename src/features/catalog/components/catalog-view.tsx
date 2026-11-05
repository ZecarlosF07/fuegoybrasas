import Form from "next/form";
import Link from "next/link";

import { CatalogHero } from "./catalog-hero";
import { CatalogVisit } from "./catalog-visit";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { CATALOG_CATEGORY_PARAM, CATALOG_FOCUS_CLASSES, CATALOG_SEARCH_MAX_LENGTH, CATALOG_SEARCH_PARAM } from "../constants";
import { visibleCategoryItems } from "../services/media";
import { catalogHref, catalogSearchTerms, matchesCatalogSearch, selectedCategorySlug } from "../services/presentation";
import type { CatalogViewProps } from "../types/catalog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export function CatalogView({ catalog, selectedSlug = "todas", search = "" }: CatalogViewProps) {
  const currentSlug = selectedCategorySlug(catalog, selectedSlug);
  const terms = catalogSearchTerms(search);
  const sections = visibleCategoryItems(catalog, currentSlug).map(({ category, items }) => ({
    category, items: terms.length ? items.filter((item) => matchesCatalogSearch(item, terms)) : items,
  })).filter(({ items }) => items.length > 0);
  const count = sections.reduce((total, section) => total + section.items.length, 0);
  const showHero = currentSlug === "todas" && !search;
  const Heading = showHero ? "h2" : "h1";
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 pb-8 pt-4 focus:outline-none md:px-6 md:pt-6 lg:px-8">
      {showHero && <CatalogHero />}
      <section id="carta" aria-labelledby="carta-titulo" className={showHero ? "mt-8 scroll-mt-6 md:mt-10" : "scroll-mt-6"}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <Heading id="carta-titulo" className="text-section-mobile font-bold md:text-section-desktop">Nuestra carta</Heading>
          <p className="text-sm text-brand-muted">Elige tus platos y coordina por WhatsApp.</p>
        </div>
        {catalog.items.length === 0 ? <div className="rounded-card border border-brand-border bg-brand-surface p-6"><p>Estamos preparando nuestra carta.</p><p className="mt-2 text-brand-muted">Vuelve a consultarla pronto para conocer nuestros platos y promociones.</p></div> : <>
          <Form action="/#carta" role="search" aria-label="Buscar en la carta" className="mb-3 flex max-w-2xl flex-wrap items-end gap-3">
            <input type="hidden" name={CATALOG_CATEGORY_PARAM} value={currentSlug} />
            <div className="min-w-0 flex-1 basis-48"><TextField key={search} id="buscar-plato" type="search" name={CATALOG_SEARCH_PARAM} label="Buscar un plato" placeholder="Ej. mostrito, alitas, chaufa" maxLength={CATALOG_SEARCH_MAX_LENGTH} defaultValue={search} /></div>
            <Button variant="secondary" type="submit">Buscar</Button>
          </Form>
          <CategoryNav categories={catalog.categories} selectedSlug={currentSlug} search={search} />
          {search && <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="min-w-0 break-words">{count === 1 ? "1 resultado" : `${count} resultados`} para «{search}»</p>
            <Link href={catalogHref(currentSlug)} className={"inline-flex min-h-12 items-center font-semibold text-brand-action underline " + CATALOG_FOCUS_CLASSES}>Limpiar búsqueda</Link>
          </div>}
          {!count && <p className="mt-4 rounded-card border border-brand-border p-4">{search ? "Prueba con otro nombre o selecciona Toda la carta para buscar en todas las categorías." : "Por ahora no hay platos en esta categoría. Elige otra categoría para seguir explorando."}</p>}
          {sections.map(({ category, items }) => <section key={category.id} aria-labelledby={`categoria-${category.slug}`} className="mt-8 scroll-mt-24 md:mt-12">
            <div className="mb-5 flex items-center gap-4"><h2 id={`categoria-${category.slug}`} className="text-section-mobile font-bold">{category.name}</h2><span className="text-sm text-brand-muted">{items.length} {items.length === 1 ? "plato" : "platos"}</span><span aria-hidden="true" className="h-px flex-1 bg-brand-border" /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {items.map((item) => <ProductCard key={item.id} item={item} selectedSlug={currentSlug} search={search} orderingEnabled={catalog.configuration.orderingEnabled} />)}
            </div>
          </section>)}
        </>}
      </section>
      <CatalogVisit catalog={catalog} />
    </main>
  );
}
