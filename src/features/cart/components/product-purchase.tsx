"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { ChoiceFields } from "./choice-fields";
import { useProductOrder } from "../hooks/use-product-order";
import type { PurchaseProps } from "../types/cart";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { TextField } from "@/components/ui/text-field";
import { orderUnitPrice } from "@/features/catalog/services/presentation";

export function ProductPurchase({ item, catalog }: PurchaseProps) {
  const order = useProductOrder(item);
  if (!catalog.configuration.orderingEnabled) return <p className="rounded-card border border-brand-border p-4">Estamos preparando los pedidos por WhatsApp. Puedes consultar la carta.</p>;
  if (item.availability !== "available") return <p>Este producto está agotado por ahora.</p>;
  if (orderUnitPrice(item) === null) return <p role="status">Consulta el precio de este plato con el local antes de agregarlo.</p>;
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    order.add(new FormData(event.currentTarget));
  }
  return <section aria-label="Agregar al pedido" className="w-full space-y-4 rounded-card border border-brand-border bg-brand-surface p-5 md:p-6">
    <div><h2 className="text-product font-semibold">Hazlo a tu gusto</h2><p className="mt-1 text-sm text-brand-muted">Elige la cantidad y agrega alguna indicación si la necesitas.</p></div>
    <FormFeedback error={order.error} message={order.notice} />
    <form method="post" onSubmit={add} className="space-y-5">
      <ChoiceFields item={item} selected={[]} />
      <div className="max-w-32"><TextField id="purchase-quantity" label="Cantidad" name="quantity" type="number" min={1} max={20} defaultValue={1} required /></div>
      <TextField id="purchase-instructions" label="Indicaciones para este producto (opcional)" name="instructions" maxLength={200} />
      <Button type="submit" className="w-full justify-between" disabled={order.disabled}>Agregar al pedido <span aria-hidden="true">+</span></Button>
    </form>
    <p className="text-sm text-brand-muted">La entrega y el costo de envío se coordinan por WhatsApp.</p>
    {order.notice && <Link href="/pedido" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Revisar pedido</Link>}
    {order.recoveryPending && <Link href="/pedido" className="inline-flex min-h-12 items-center underline">Resolver borrador pendiente</Link>}
  </section>;
}
