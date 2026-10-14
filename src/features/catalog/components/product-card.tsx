import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { productHref } from "../services/presentation";
import type { ProductCardProps } from "../types/catalog";
import { buttonClasses } from "@/components/ui/button-classes";

export function ProductCard({ item, selectedSlug }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-brand-border bg-brand-surface transition-colors duration-feedback hover:border-brand-control-border motion-reduce:transition-none">
      <ProductImage item={item} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        {item.kind === "promotion" && <p className="self-start rounded-field bg-brand-bg px-3 py-1 text-sm font-semibold text-brand-action">En promoción</p>}
        {item.availability === "sold_out" && <p className="font-semibold text-brand-muted">Agotado por ahora</p>}
        <h3 className="text-product font-semibold">{item.name}</h3>
        {item.portionLabel && <p className="font-medium">{item.portionLabel}</p>}
        {item.inclusions.length > 0 && <p className="text-brand-muted">Incluye {item.inclusions.join(", ").toLowerCase()}.</p>}
        <div className="mt-auto pt-1"><ProductPrice item={item} /></div>
        <Link href={productHref(item, selectedSlug)} className={`${buttonClasses("secondary")} ${CATALOG_FOCUS_CLASSES}`} aria-label={`Ver detalle de ${item.name}${item.portionLabel ? `, ${item.portionLabel}` : ""}`}>
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
