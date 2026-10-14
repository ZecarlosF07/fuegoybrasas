import Image from "next/image";
import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { visibleCategoryVisuals } from "../services/media";
import { catalogHref } from "../services/presentation";
import type { CatalogProps } from "../types/catalog";

export function CategoryHighlights({ catalog }: CatalogProps) {
  const categories = visibleCategoryVisuals(catalog);
  if (categories.length === 0) return null;

  return (
    <section aria-label="Explorar nuestros platos" className="py-8 md:py-12">
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {categories.map((category) => (
          <Link key={category.slug} href={catalogHref(category.slug)} className={`group overflow-hidden rounded-card border border-brand-border bg-brand-surface transition-colors duration-feedback hover:border-brand-control-border motion-reduce:transition-none ${CATALOG_FOCUS_CLASSES}`}>
            <div className="relative aspect-4/3 overflow-hidden bg-brand-ink">
              <Image src={category.src} alt="" fill sizes="(max-width: 767px) 33vw, 380px" className="object-contain" />
            </div>
            <div className="flex min-h-12 items-center justify-between gap-2 p-3 md:p-4">
              <div><h2 className="font-semibold">{category.label}</h2><p className="mt-1 hidden text-sm text-brand-muted md:block">{category.description}</p></div>
              <span aria-hidden="true" className="hidden text-brand-action md:block">↗</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-sm text-brand-muted">Imágenes referenciales. Las inclusiones y porciones se indican en cada plato.</p>
    </section>
  );
}
