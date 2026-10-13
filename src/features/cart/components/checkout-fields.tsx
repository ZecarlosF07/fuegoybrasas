"use client";

import { useCart } from "./cart-provider";
import type { CheckoutFieldsProps } from "../types/cart";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { ApplyPreferences } from "@/features/loyalty/components/apply-preferences";
import { parseSolesToCents } from "@/lib/money/utils";

export function CheckoutFields({ catalog }: CheckoutFieldsProps) {
  const cart = useCart();
  const fields = cart.draft.checkout;
  const errors = cart.error?.fieldErrors;
  const payment = catalog.configuration.paymentMethods.find((method) => method.code === fields.paymentMethodCode);
  const disabled = cart.validating || cart.blocked || cart.expired || cart.external;
  function change(field: keyof typeof fields, value: string | number | null) { cart.dispatch({ type: "setCheckout", fields: { ...cart.draft.checkout, [field]: value } }); }
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="mb-4 text-product font-semibold">Datos para coordinar tu pedido</legend>
    <TextField id="name" label="Tu nombre" autoComplete="given-name" value={fields.name} maxLength={80} error={errors?.name?.[0]} onChange={(event) => change("name", event.target.value)} required />
    {cart.draft.mode === "delivery" && <>
      <TextField id="address" label="Dirección de entrega" autoComplete="street-address" value={fields.address} minLength={5} maxLength={250} error={errors?.address?.[0]} onChange={(event) => change("address", event.target.value)} required />
      <TextField id="reference" label="Referencia de la dirección (opcional)" value={fields.reference} maxLength={200} onChange={(event) => change("reference", event.target.value)} />
      <SelectField id="deliveryZoneId" label="Zona" value={fields.deliveryZoneId} onChange={(event) => change("deliveryZoneId", event.target.value)} help="Si tu zona no aparece, coordinaremos cobertura y cargo por WhatsApp."><option value="">Coordinar mi dirección por WhatsApp</option>{catalog.configuration.deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.coverage === "excluded" ? " · no atendida" : ""}</option>)}{fields.deliveryZoneId && !catalog.configuration.deliveryZones.some((zone) => zone.id === fields.deliveryZoneId) && <option value={fields.deliveryZoneId}>Zona retirada: elige otra opción</option>}</SelectField>
    </>}
    {cart.draft.mode === "pickup" && <p>Recojo en {catalog.configuration.address ?? "ubicación pendiente"}. La atención se confirma por WhatsApp.</p>}
    <SelectField id="paymentMethodCode" label="Medio de pago" value={fields.paymentMethodCode} error={errors?.paymentMethodCode?.[0]} onChange={(event) => change("paymentMethodCode", event.target.value)} required><option value="">Selecciona un medio de pago</option>{catalog.configuration.paymentMethods.map((method) => <option key={method.id} value={method.code}>{method.label}</option>)}{fields.paymentMethodCode && !payment && <option value={fields.paymentMethodCode}>Pago retirado: elige otro</option>}</SelectField>
    {payment?.instructions && <p className="text-sm text-brand-muted">{payment.instructions}</p>}
    {payment?.needsChange && <TextField id="changeForCents" name="changeForCents" label="Cambio para (soles, opcional)" inputMode="decimal" key={`${payment.id}-change`} defaultValue={fields.changeForCents === null ? "" : (fields.changeForCents / 100).toFixed(2)} error={errors?.changeForCents?.[0]} help="Si el total está pendiente, coordinaremos el cambio por WhatsApp." onBlur={(event) => {
      try { change("changeForCents", event.target.value ? parseSolesToCents(event.target.value) : null); }
      catch { cart.setError({ code: "VALIDATION_ERROR", message: "Revisa el importe para el cambio.", fieldErrors: { changeForCents: ["Usa soles con hasta dos decimales."] } }); }
    }} />}
    <TextField id="instructions" label="Indicaciones generales (opcional)" value={fields.instructions} maxLength={500} onChange={(event) => change("instructions", event.target.value)} />
    <ApplyPreferences />
  </fieldset>;
}
