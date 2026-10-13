"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { MODE_LABELS } from "../constants";
import { useCart } from "./cart-provider";
import { ChoiceFields } from "./choice-fields";
import { purchaseLine } from "../services/purchase";
import type { PurchaseProps } from "../types/cart";
import { modeSchema } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { CATALOG_FOCUS_CLASSES } from "@/features/catalog/constants";
import { formatPen } from "@/lib/money/utils";

export function ProductPurchase({ item, catalog }: PurchaseProps) {
  const cart = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  if (!catalog.configuration.orderingEnabled) return <p className="rounded-card border border-brand-border p-4">Estamos preparando los pedidos por WhatsApp. Puedes consultar la carta.</p>;
  if (item.availability !== "available") return <p>Este producto está agotado por ahora.</p>;
  const prices = item.prices.filter((price) => price.mode !== "pickup" || catalog.configuration.locationVerified && catalog.configuration.address);
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const line = purchaseLine(item, form, crypto.randomUUID(), modeSchema.parse(form.get("mode")));
      if (cart.dispatch({ type: "addLine", line, mode: modeSchema.parse(form.get("mode")) })) setNotice("Producto agregado. Puedes seguir eligiendo o revisar el pedido.");
    } catch (cause) { cart.setError({ code: "VALIDATION_ERROR", message: cause instanceof Error ? cause.message : "Revisa tus opciones." }); }
  }
  return <section aria-label="Agregar al pedido" className="w-full space-y-4 rounded-card border border-brand-border bg-brand-surface p-4">
    <h2 className="text-product font-semibold">Elige para tu pedido</h2>
    <FormFeedback error={cart.error} message={notice} />
    <form method="post" onSubmit={add} className="space-y-4">
      <SelectField id="purchase-mode" label="Modalidad" name="mode" defaultValue={cart.draft.mode ?? prices[0]?.mode} required><option value="" disabled>Elige una modalidad</option>{prices.map((price) => <option key={price.mode} value={price.mode}>{MODE_LABELS[price.mode]} · {formatPen(price.priceCents)}</option>)}</SelectField>
      <ChoiceFields item={item} selected={[]} />
      <TextField id="purchase-quantity" label="Cantidad" name="quantity" type="number" min={1} max={20} defaultValue={1} required />
      <TextField id="purchase-instructions" label="Indicaciones para este producto (opcional)" name="instructions" maxLength={200} />
      <Button type="submit" disabled={!cart.ready || cart.blocked || cart.expired || cart.external || !prices.length}>Agregar al pedido</Button>
    </form>
    {notice && <Link href="/pedido" className={`inline-flex min-h-12 items-center font-semibold text-brand-action underline ${CATALOG_FOCUS_CLASSES}`}>Revisar pedido</Link>}
    {(cart.blocked || cart.expired || cart.external) && <Link href="/pedido" className="inline-flex min-h-12 items-center underline">Resolver borrador pendiente</Link>}
  </section>;
}
