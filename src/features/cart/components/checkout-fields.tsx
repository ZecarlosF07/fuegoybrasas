"use client";

import { useCart } from "./cart-provider";
import { TextField } from "@/components/ui/text-field";
import { ApplyPreferences } from "@/features/loyalty/components/apply-preferences";

export function CheckoutFields() {
  const cart = useCart();
  return <fieldset disabled={cart.validating || cart.blocked || cart.expired || cart.external} className="space-y-4">
    <legend className="mb-3 font-semibold">¿Alguna indicación para cocina?</legend>
    <TextField id="instructions" label="Indicaciones generales (opcional)" value={cart.draft.checkout.instructions} maxLength={500}
      onChange={(event) => cart.dispatch({ type: "setCheckout", fields: { instructions: event.target.value } })} />
    <ApplyPreferences />
  </fieldset>;
}
