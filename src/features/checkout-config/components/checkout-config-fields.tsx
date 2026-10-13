import type { FormEvent } from "react";

import type { CheckoutFieldProps } from "../types/config";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";

export function invalidateCheckoutVerification(event: FormEvent<HTMLFormElement>) {
  if (!(event.target instanceof HTMLElement)) return;
  if (["enabled", "verified", "sort_order"].includes(event.target.getAttribute("name") ?? "")) return;
  const checkbox = event.currentTarget.elements.namedItem("verified");
  if (checkbox instanceof HTMLInputElement) checkbox.checked = false;
}
export function CheckoutConfigFields({ selection, disabled, errors }: CheckoutFieldProps) {
  const { row, entityType, creating } = selection;
  const payment = "label" in row ? row : null;
  const zone = "coverage" in row ? row : null;
  return <fieldset disabled={disabled} className="space-y-4">
    {entityType === "payment_method" ? <>
      <TextField id="code" label="Código del pago" name="code" defaultValue={payment?.code ?? ""} readOnly={!creating} help="Minúsculas, números y guiones. El código se conserva después de crear el pago." error={errors?.code?.[0]} required maxLength={80} />
      <TextField id="label" label="Nombre del medio de pago" name="label" defaultValue={payment?.label ?? ""} error={errors?.label?.[0]} required maxLength={120} />
      <TextField id="instructions" label="Indicaciones de pago (opcional)" name="instructions" defaultValue={payment?.instructions ?? ""} error={errors?.instructions?.[0]} maxLength={500} />
      <CheckboxField id="needs_change" label="Este pago admite solicitar cambio" name="needs_change" defaultChecked={payment?.needs_change ?? false} />
      <TextField id="sort_order" label="Orden" name="sort_order" type="number" min={0} defaultValue={payment?.sort_order ?? 0} error={errors?.sort_order?.[0]} />
    </> : <>
      <TextField id="name" label="Nombre de la zona" name="name" defaultValue={zone?.name ?? ""} error={errors?.name?.[0]} required maxLength={120} />
      <SelectField id="coverage" label="Cobertura" name="coverage" defaultValue={zone?.coverage ?? "allowed"}><option value="allowed">Atendida</option><option value="excluded">No atendida</option></SelectField>
      <TextField id="fee_cents" label="Cargo (soles, opcional)" name="fee_cents" inputMode="decimal" defaultValue={zone?.fee_cents === null || zone?.fee_cents === undefined ? "" : (zone.fee_cents / 100).toFixed(2)} error={errors?.fee_cents?.[0]} help="Vacío significa pendiente de confirmación. Cero solo si confirmaste que no hay cargo." />
      <TextField id="minimum_subtotal_cents" label="Compra mínima (soles, opcional)" name="minimum_subtotal_cents" inputMode="decimal" defaultValue={zone?.minimum_subtotal_cents === null || zone?.minimum_subtotal_cents === undefined ? "" : (zone.minimum_subtotal_cents / 100).toFixed(2)} error={errors?.minimum_subtotal_cents?.[0]} help="Vacío conserva el mínimo como pendiente." />
    </>}
    <CheckboxField id="enabled" label="Habilitado para mostrar en el pedido" name="enabled" defaultChecked={row.enabled ?? false} />
    <CheckboxField id="verified" label="Confirmé las condiciones con el responsable" name="verified" defaultChecked={row.verified ?? false} help="Se desmarca al editar condiciones. Verifica expresamente antes de habilitar." />
  </fieldset>;
}
