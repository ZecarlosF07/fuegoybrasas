"use client";

import type { FormEvent } from "react";

import { managementFormError, peruvianDatetime } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { CorrectionProps } from "../types/management";
import { contingencySchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function ContingencyForm({ card, operation }: CorrectionProps) {
  const disabled = managementBlocked(operation, "contingency") || !card.programEnabled || card.cardStatus !== "active";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const values = new FormData(event.currentTarget);
    const localDate = String(values.get("occurredAt") ?? "");
    const parsed = contingencySchema.safeParse({ customerId: card.customerId, operationId: operation.journal?.operationId ?? crypto.randomUUID(), occurredAt: peruvianDatetime(localDate),
      visitReference: values.get("contingencyReference"), reason: values.get("contingencyReason"), paidConfirmed: values.get("contingencyPaid") === "on", deliveredConfirmed: values.get("contingencyDelivered") === "on" });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "contingency")); return; }
    await operation.run("contingency", parsed.data);
  }
  return <form method="post" noValidate onSubmit={submit} className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Conciliar una visita durante una caída</h2><p>Comprueba el registro interno y que no tenga ya un sello. Conserva la fecha real en hora peruana, distinta del registro de hoy. No se admiten visitas anteriores a la tarjeta ni fechas futuras.</p>
    <fieldset disabled={disabled} className="space-y-4">
      <TextField id="occurredAt" name="occurredAt" type="datetime-local" step="1" label="Fecha y hora real de entrega (Perú)" required />
      <TextField id="contingencyReference" name="contingencyReference" label="Referencia única del registro de contingencia" maxLength={80} required />
      <TextField id="contingencyReason" name="contingencyReason" label="Motivo de conciliación" minLength={10} maxLength={500} required />
      <CheckboxField id="contingencyPaid" name="contingencyPaid" label="La compra presencial estaba pagada" /><CheckboxField id="contingencyDelivered" name="contingencyDelivered" label="El pedido se entregó físicamente en la fecha indicada" />
    </fieldset><SubmitButton label="Acreditar visita conciliada" pendingLabel="Conciliando y registrando visita…" pending={operation.pending && operation.journal?.kind === "contingency"} disabled={disabled} />
  </form>;
}
