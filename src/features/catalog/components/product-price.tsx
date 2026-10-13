import { productPrice } from "../services/presentation";
import type { ProductProps } from "../types/catalog";
import { formatPen } from "@/lib/money/utils";

export function ProductPrice({ item }: ProductProps) {
  const previousPrice = item.promotion?.previousPriceCents;
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className="text-xl font-bold tabular-nums">{productPrice(item)}</span>
      {previousPrice !== null && previousPrice !== undefined && (
        <span className="text-sm text-brand-muted">Antes <s>{formatPen(previousPrice)}</s></span>
      )}
    </div>
  );
}
