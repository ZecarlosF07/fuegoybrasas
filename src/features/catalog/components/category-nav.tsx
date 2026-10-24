import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { catalogHref } from "../services/presentation";
import type { CategoryNavProps } from "../types/catalog";

export function CategoryNav({ categories, selectedSlug }: CategoryNavProps) {
  const entries = [{ slug: "todas", name: "Toda la carta" }, ...categories];
  return (
    <nav aria-label="Categorías de la carta" className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto border-b border-brand-border bg-brand-bg p-1 pb-3 pt-3">
      {entries.map((entry) => (
        <Link key={entry.slug} href={catalogHref(entry.slug)} aria-current={selectedSlug === entry.slug ? "page" : undefined}
          className={`inline-flex min-h-12 shrink-0 items-center rounded-button border px-4 font-semibold ${CATALOG_FOCUS_CLASSES} ${selectedSlug === entry.slug ? "border-brand-action bg-brand-action text-brand-surface" : "border-brand-control-border bg-brand-surface text-brand-ink hover:bg-brand-subtle"}`}>
          {entry.name}
        </Link>
      ))}
    </nav>
  );
}
