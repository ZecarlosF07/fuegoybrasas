import { BusinessInfo } from "./business-info";
import type { CatalogProps } from "../types/catalog";

export function CatalogVisit({ catalog }: CatalogProps) {
  return (
    <section aria-labelledby="visitanos-titulo" className="mt-12 grid gap-6 rounded-card border border-brand-border bg-brand-surface p-6 md:grid-cols-2 md:p-8">
      <div><p className="mb-2 text-sm font-semibold text-brand-gold-ink">Fuego y Brasas · Parcona, Ica</p><h2 id="visitanos-titulo" className="font-brand text-section-mobile font-semibold">Siempre hay un buen motivo para compartir.</h2></div>
      <div className="flex flex-col justify-center"><BusinessInfo catalog={catalog} /></div>
    </section>
  );
}
