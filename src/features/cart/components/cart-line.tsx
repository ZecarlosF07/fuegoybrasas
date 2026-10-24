"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useCart } from "./cart-provider";
import { ChoiceFields } from "./choice-fields";
import { purchaseLine } from "../services/purchase";
import type { CartLineProps } from "../types/cart";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { orderUnitPrice } from "@/features/catalog/services/presentation";
import { formatPen } from "@/lib/money/utils";

export function CartLineEditor({ line, item }: CartLineProps) {
  const cart = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const knownChoices = new Set(item?.optionGroups.flatMap((group) => group.choices.map((choice) => choice.id)) ?? []);
  const currentPrice = item ? orderUnitPrice(item) : null;
  const disabled = cart.blocked || cart.expired || cart.external || cart.validating;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    try {
      const updated = purchaseLine(item, new FormData(event.currentTarget), line.lineId);
      if (cart.dispatch({ type: "editLine", line: updated })) setMessage("Producto actualizado. Revisa el pedido antes de continuar.");
    } catch (cause) { cart.setError({ code: "VALIDATION_ERROR", message: cause instanceof Error ? cause.message : "Revisa el producto." }); }
  }
  return <article className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-product font-semibold">{line.displaySnapshot.name}</h2>
    <p>{line.displaySnapshot.portion} · {line.quantity} {line.quantity === 1 ? "unidad" : "unidades"} · {formatPen(line.observedUnitPriceCents)} c/u</p>
    <p className="font-semibold">Subtotal provisional: {formatPen(line.quantity * line.observedUnitPriceCents)}</p>
    {currentPrice !== null && currentPrice !== line.observedUnitPriceCents && <p>Precio base actual: {formatPen(currentPrice)}. Guarda el producto para aceptar el precio y las opciones actuales.</p>}
    {!item && <p role="alert">El producto ya no está disponible en la carta. Puedes retirarlo y volver a elegir.</p>}
    {line.instructionsStatus === "needs_review" && <p role="alert">Las indicaciones de este producto no se recuperaron. Escríbelas de nuevo o confirma expresamente continuar sin ellas.</p>}
    {line.choiceIds.some((id) => !knownChoices.has(id)) && <p role="alert">Hay opciones retiradas. Revisa y guarda las opciones vigentes.</p>}
    {item && <form method="post" onSubmit={save} className="space-y-4">
      <TextField id={`${line.lineId}-quantity`} label="Cantidad" name="quantity" type="number" min={1} max={20} defaultValue={line.quantity} disabled={disabled} required />
      <ChoiceFields item={item} selected={line.choiceIds} disabled={disabled} prefix={line.lineId} />
      <TextField id={`${line.lineId}-instructions`} label="Indicaciones del producto (opcional)" name="instructions" maxLength={200} defaultValue={line.instructions} disabled={disabled} />
      <Button type="submit" variant="secondary" disabled={disabled}>Guardar producto e indicaciones</Button>
    </form>}
    <div className="flex flex-wrap gap-3">
      {line.instructionsStatus === "needs_review" && <Button variant="secondary" disabled={disabled} onClick={() => cart.dispatch({ type: "editLine", line: { ...line, instructions: "", instructionsStatus: "ready" } })}>Confirmar sin indicaciones</Button>}
      <Button variant="secondary" disabled={disabled} onClick={() => cart.dispatch({ type: "removeLine", lineId: line.lineId })}>Retirar {line.displaySnapshot.name}</Button>
    </div>
    {message && <p role="status" className="text-brand-success">{message}</p>}
  </article>;
}
