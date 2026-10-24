"use client";

import Link from "next/link";

import { useProductOrder } from "../hooks/use-product-order";
import type { ProductCardActionProps } from "../types/cart";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { productHref } from "@/features/catalog/services/presentation";

export function ProductCardAction({ item, orderingEnabled, selectedSlug }: ProductCardActionProps) {
  const order = useProductOrder(item);
  if (!orderingEnabled || item.availability !== "available") return null;
  if (item.optionGroups.some((group) => group.minChoices > 0)) return <Link href={productHref(item, selectedSlug)} className={buttonClasses("primary")}>Elegir opciones</Link>;
  function add() {
    const form = new FormData();
    form.set("quantity", "1");
    order.add(form);
  }
  return <div className="space-y-2">
    <Button onClick={add} disabled={order.disabled} className="w-full" aria-label={"Agregar " + item.name + (item.portionLabel ? ", " + item.portionLabel : "")}>Agregar al pedido <span aria-hidden="true">+</span></Button>
    {order.notice && <p role="status" className="text-sm text-brand-success">Agregado. <Link href="/pedido" className="inline-flex min-h-12 items-center font-semibold underline">Ver mi pedido</Link></p>}
    {order.error && <p role="alert" className="text-sm text-brand-danger">{order.error.message}</p>}
    {order.recoveryPending && <Link href="/pedido" className="inline-flex min-h-12 items-center text-sm underline">Resolver borrador pendiente</Link>}
  </div>;
}
