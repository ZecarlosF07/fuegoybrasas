import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { catalogHref } from "../services/presentation";
import type { CategoryNavProps } from "../types/catalog";

export function CategoryNav({ categories, selectedSlug, search }: CategoryNavProps) {
  const entries = [{ slug: "todas", name: "Toda la carta" }, ...categories];
  return (
    <nav aria-label="Categorías de la carta" className="-mx-1 flex flex-wrap gap-2 border-b border-brand-border bg-brand-bg p-1 pb-3 pt-3 lg:sticky lg:top-0 lg:z-10">
      {entries.map((entry) => (
        <Link key={entry.slug} href={catalogHref(entry.slug, search)} aria-current={selectedSlug === entry.slug ? "page" : undefined}
          className={`inline-flex min-h-12 max-w-full items-center rounded-button border px-3 font-semibold wrap-anywhere md:px-4 ${CATALOG_FOCUS_CLASSES} ${selectedSlug === entry.slug ? "border-brand-action bg-brand-action text-brand-surface" : "border-brand-control-border bg-brand-surface text-brand-ink hover:bg-brand-subtle"}`}>
          {entry.name}
        </Link>
      ))}
    </nav>
  );
}
