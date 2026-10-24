"use client";

import Link from "next/link";

import { useCart } from "./cart-provider";
import { provisionalSubtotal } from "../services/draft";
import { buttonClasses } from "@/components/ui/button-classes";
import { formatPen } from "@/lib/money/utils";

export function CartDock() {
  const cart = useCart();
  if (!cart.ready || !cart.draft.lines.length) return null;
  const count = cart.draft.lines.reduce((sum, line) => sum + line.quantity, 0);
  return <aside aria-label="Resumen del pedido" className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-control-border bg-brand-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
    <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-2"><p className="text-sm"><strong>{count} {count === 1 ? "producto" : "productos"} · {formatPen(provisionalSubtotal(cart.draft.lines))}</strong><br />Subtotal de productos</p><Link href="/pedido" className={buttonClasses("primary")}>Ver pedido</Link></div>
  </aside>;
}
