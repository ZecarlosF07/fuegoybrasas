import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { productHref } from "../services/presentation";
import type { ProductCardProps } from "../types/catalog";
import { ProductCardAction } from "@/features/cart/components/product-card-action";

export function ProductCard({ item, selectedSlug, orderingEnabled = false }: ProductCardProps) {
  const href = productHref(item, selectedSlug);
  const label = item.name + (item.portionLabel ? ", " + item.portionLabel : "");
  return <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-border bg-brand-surface transition-colors duration-feedback hover:border-brand-control-border motion-reduce:transition-none">
    <Link href={href} aria-label={"Ver foto y detalle de " + label} className={"block " + CATALOG_FOCUS_CLASSES}><ProductImage item={item} /></Link>
    <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
      {item.kind === "promotion" && <p className="self-start rounded-field bg-brand-action px-3 py-1 text-sm font-semibold text-brand-surface">En promoción</p>}
      {item.availability === "sold_out" && <p className="font-semibold text-brand-muted">Agotado por ahora</p>}
      <div><h3 className="font-brand text-2xl font-bold"><Link href={href} className={CATALOG_FOCUS_CLASSES}>{item.name}</Link></h3>{item.portionLabel && <p className="mt-1 font-medium text-brand-muted">{item.portionLabel}</p>}</div>
      {item.inclusions.length > 0 && <p className="text-sm leading-6 text-brand-muted">{item.inclusions.join(" · ")}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3"><ProductPrice item={item} /><Link href={href} className={"inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-brand-action underline underline-offset-4 " + CATALOG_FOCUS_CLASSES} aria-label={"Ver detalle de " + label}>Ver detalle <span aria-hidden="true">↗</span></Link></div>
      <ProductCardAction item={item} orderingEnabled={orderingEnabled} selectedSlug={selectedSlug} />
    </div>
  </article>;
}
