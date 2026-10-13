"use client";

import type { FormEvent } from "react";

import { formBlocked, formOperationId, loyaltyFormError } from "../services/forms";
import type { StaffFormProps } from "../types/loyalty";
import { creditSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function CreditForm({ card, operation }: StaffFormProps) {
  const disabled = formBlocked(operation, "credit", card.customerId) || !card.programEnabled || card.cardStatus !== "active";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const form = new FormData(event.currentTarget);
    const parsed = creditSchema.safeParse({ customerId: card.customerId, operationId: formOperationId(operation), paidConfirmed: form.get("paidConfirmed") === "on", deliveredConfirmed: form.get("deliveredConfirmed") === "on", visitReference: form.get("visitReference") });
    if (!parsed.success) { operation.setError(loyaltyFormError(parsed.error)); return; }
    await operation.run("credit", parsed.data);
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Acreditar una visita</h2><p>Un sello por esta visita presencial. Confirma la compra de {card.displayName} después de entregar el pedido.</p>
    <fieldset disabled={disabled} className="space-y-4">
      <CheckboxField id="paidConfirmed" name="paidConfirmed" label="La compra presencial está pagada" />
      <CheckboxField id="deliveredConfirmed" name="deliveredConfirmed" label="El pedido ya fue entregado al cliente" />
      <TextField id="visitReference" name="visitReference" label="Referencia de visita o comprobante (opcional)" maxLength={80} help="Usa una referencia mínima; no incluyas teléfono, platos ni montos. La misma referencia no puede acreditar dos visitas." />
    </fieldset>
    <SubmitButton pending={operation.pending && operation.journal?.kind === "credit"} label={operation.journal?.kind === "credit" ? "Reintentar esta acreditación" : "Registrar un sello"} pendingLabel="Registrando sello…" disabled={disabled} />
  </form>;
}
