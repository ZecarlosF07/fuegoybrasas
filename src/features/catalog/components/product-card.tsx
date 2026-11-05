import Link from "next/link";

import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { productHref } from "../services/presentation";
import type { ProductCardProps } from "../types/catalog";
import { ProductCardAction } from "@/features/cart/components/product-card-action";

export function ProductCard({ item, selectedSlug, search, orderingEnabled = false }: ProductCardProps) {
  const href = productHref(item, selectedSlug, search);
  const label = item.name + (item.portionLabel ? ", " + item.portionLabel : "");
  return <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-border bg-brand-surface transition-colors duration-feedback hover:border-brand-control-border motion-reduce:transition-none">
    <Link href={href} aria-label={"Ver detalle de " + label} className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-action">
      <ProductImage item={item} />
      <div className="px-5 pt-4 md:px-6">
        <h3 className="font-brand text-2xl font-bold group-hover:text-brand-action">{item.name} <span aria-hidden="true" className="font-sans text-base text-brand-action">↗</span></h3>
        {item.portionLabel && <p className="mt-1 font-medium text-brand-muted">{item.portionLabel}</p>}
      </div>
    </Link>
    <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
      {item.kind === "promotion" && <p className="self-start rounded-field bg-brand-action px-3 py-1 text-sm font-semibold text-brand-surface">En promoción</p>}
      {item.availability === "sold_out" && <p className="font-semibold text-brand-muted">Agotado por ahora</p>}
      {item.inclusions.length > 0 && <p className="text-sm leading-6 text-brand-muted">{item.inclusions.join(" · ")}</p>}
      <div className="mt-auto pt-2"><ProductPrice item={item} /></div>
      <ProductCardAction item={item} orderingEnabled={orderingEnabled} detailHref={href} />
    </div>
  </article>;
}
