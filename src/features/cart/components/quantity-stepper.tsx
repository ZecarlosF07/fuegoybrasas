import { CART_MAX_QUANTITY } from "../constants";
import type { QuantityStepperProps } from "../types/cart";

const CONTROL_CLASSES = "grid size-12 shrink-0 place-items-center rounded-button border border-brand-control-border bg-brand-surface text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action hover:bg-brand-subtle aria-disabled:cursor-not-allowed aria-disabled:text-brand-muted disabled:cursor-not-allowed disabled:text-brand-muted";

export function QuantityStepper({ quantity, itemName, onChange, disabled }: QuantityStepperProps) {
  const atMinimum = quantity <= 1;
  const atMaximum = quantity >= CART_MAX_QUANTITY;
  return <div className="space-y-2">
    <p className="font-semibold">Cantidad</p>
    <div role="group" aria-label={`Cantidad de ${itemName}`} className="flex items-center gap-2">
      <button type="button" className={CONTROL_CLASSES} aria-label={`Reducir cantidad de ${itemName}`} disabled={disabled} aria-disabled={atMinimum} onClick={() => { if (!atMinimum) onChange(quantity - 1); }}>−</button>
      <output aria-label={`Unidades de ${itemName}`} className="min-w-12 text-center text-lg font-bold tabular-nums">{quantity}</output>
      <button type="button" className={CONTROL_CLASSES} aria-label={`Aumentar cantidad de ${itemName}`} disabled={disabled} aria-disabled={atMaximum} onClick={() => { if (!atMaximum) onChange(quantity + 1); }}>+</button>
    </div>
  </div>;
}
