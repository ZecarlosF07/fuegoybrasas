"use client";

import type { FormEvent } from "react";

import { formBlocked, formOperationId, loyaltyFormError } from "../services/forms";
import type { StaffFormProps } from "../types/loyalty";
import { incidentSchema } from "../validation/schemas";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function IncidentForm({ card, operation }: StaffFormProps) {
  const disabled = formBlocked(operation, "incident", card.customerId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const form = new FormData(event.currentTarget);
    const parsed = incidentSchema.safeParse({ customerId: card.customerId, operationId: formOperationId(operation), type: form.get("incidentType"), description: form.get("description"), rewardId: form.get("incidentRewardId") || null, sourceEventId: null });
    if (!parsed.success) { operation.setError(loyaltyFormError(parsed.error)); return; }
    await operation.run("incident", parsed.data);
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Registrar incidencia</h2><p>El registro no modifica saldo ni devuelve un premio automáticamente. El responsable revisará el caso.</p>
    <fieldset disabled={disabled} className="space-y-4">
      <SelectField id="incidentType" name="incidentType" label="Tipo de incidencia"><option value="other">Anomalía de registro</option><option value="reward_delivery_failed">Canje registrado sin entrega del premio</option></SelectField>
      <SelectField id="incidentRewardId" name="incidentRewardId" label="Premio canjeado relacionado"><option value="">Sin premio relacionado</option>{card.recentEvents.filter((event) => event.type === "reward_redeemed" && event.rewardId).map((event) => <option key={event.id} value={event.rewardId ?? ""}>Canje del {new Date(event.date).toLocaleDateString("es-PE")}</option>)}</SelectField>
      <TextField id="description" name="description" label="Descripción de la incidencia" minLength={10} maxLength={500} help="Entre 10 y 500 caracteres; evita datos personales y el cuerpo completo del pedido." required />
    </fieldset>
    <SubmitButton pending={operation.pending && operation.journal?.kind === "incident"} label="Registrar incidencia" pendingLabel="Registrando incidencia…" disabled={disabled} />
  </form>;
}
