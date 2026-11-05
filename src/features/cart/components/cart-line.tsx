"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useCart } from "./cart-provider";
import { ChoiceFields } from "./choice-fields";
import { QuantityStepper } from "./quantity-stepper";
import { purchaseLine } from "../services/purchase";
import type { CartLineProps } from "../types/cart";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { orderUnitPrice } from "@/features/catalog/services/presentation";
import { formatPen } from "@/lib/money/utils";

export function CartLineEditor({ line, item }: CartLineProps) {
  const cart = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const availableChoices = item?.optionGroups.flatMap((group) => group.choices) ?? [];
  const knownChoices = new Set(availableChoices.map((choice) => choice.id));
  const basePrice = item ? orderUnitPrice(item) : null;
  const currentExtras = availableChoices.filter((choice) => line.choiceIds.includes(choice.id))
    .reduce((sum, choice) => sum + choice.extraPriceCents, 0);
  const priceChanged = basePrice !== null && basePrice + currentExtras !== line.observedUnitPriceCents;
  const choicesChanged = Boolean(item && line.choiceIds.some((id) => !knownChoices.has(id)));
  const disabled = cart.blocked || cart.expired || cart.external || cart.validating;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    try {
      const form = new FormData(event.currentTarget);
      form.set("quantity", String(line.quantity));
      const updated = purchaseLine(item, form, line.lineId);
      if (cart.dispatch({ type: "editLine", line: updated })) setMessage("Producto actualizado. Revisa el pedido antes de continuar.");
    } catch (cause) { cart.setError({ code: "VALIDATION_ERROR", message: cause instanceof Error ? cause.message : "Revisa el producto." }); }
  }
  const { name, portion, choices } = line.displaySnapshot;
  const itemName = portion ? `${name}, ${portion}` : name;
  return <article className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <div className="flex flex-wrap justify-between gap-2">
      <div className="min-w-0"><h2 className="text-product font-semibold">{name}</h2>
        <p className="text-brand-muted">{portion && `${portion} · `}{formatPen(line.observedUnitPriceCents)} c/u</p>
      </div>
      <p className="font-bold tabular-nums text-brand-action">{formatPen(line.quantity * line.observedUnitPriceCents)}</p>
    </div>
    {choices.length > 0 && <p className="text-sm">Opciones: {choices.join(" · ")}</p>}
    {line.instructions && <p className="text-sm wrap-anywhere">Indicaciones: {line.instructions}</p>}
    {priceChanged && <p>El precio de este plato cambió. Revisa el pedido para ver el importe actualizado.</p>}
    {!item && <p role="alert">El producto ya no está disponible en la carta. Puedes retirarlo y volver a elegir.</p>}
    {line.instructionsStatus === "needs_review" && <p role="alert">Las indicaciones de este producto no se recuperaron. Escríbelas de nuevo o confirma expresamente continuar sin ellas.</p>}
    {choicesChanged && <p role="alert">Hay opciones retiradas. Revisa y guarda las opciones vigentes.</p>}
    <div className="flex flex-wrap items-end justify-between gap-3">
      {item?.availability === "available" && <QuantityStepper itemName={itemName} quantity={line.quantity} disabled={disabled}
        onChange={(quantity) => { if (cart.dispatch({ type: "setQuantity", lineId: line.lineId, quantity })) setMessage(null); }} />}
      <Button variant="secondary" disabled={disabled} onClick={() => cart.dispatch({ type: "removeLine", lineId: line.lineId })} aria-label={`Retirar ${itemName}`}>Retirar</Button>
    </div>
    {item && <details open={choicesChanged || line.instructionsStatus === "needs_review"} className="border-t border-brand-border pt-2">
      <summary className="min-h-12 cursor-pointer rounded-field py-3 font-semibold text-brand-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">
        {item.optionGroups.length ? "Editar opciones e indicaciones" : "Editar indicaciones"}
      </summary>
      <form method="post" onSubmit={save} className="space-y-4 py-2">
        <ChoiceFields item={item} selected={line.choiceIds} disabled={disabled} prefix={line.lineId} />
        <TextField id={`${line.lineId}-instructions`} label="Indicaciones del producto (opcional)" name="instructions" maxLength={200} defaultValue={line.instructions} disabled={disabled} />
        {priceChanged && <p className="text-sm text-brand-muted">Guardar este plato también acepta su precio actualizado con las opciones que elijas.</p>}
        <Button type="submit" variant="secondary" disabled={disabled}>{priceChanged ? "Guardar y aceptar el precio actual" : "Guardar producto e indicaciones"}</Button>
      </form>
      {line.instructionsStatus === "needs_review" && <Button variant="secondary" disabled={disabled} onClick={() => cart.dispatch({ type: "editLine", line: { ...line, instructions: "", instructionsStatus: "ready" } })}>Confirmar sin indicaciones</Button>}
    </details>}
    {message && <p role="status" className="text-brand-success">{message}</p>}
  </article>;
}
