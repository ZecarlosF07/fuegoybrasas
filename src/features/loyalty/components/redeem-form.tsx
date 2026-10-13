"use client";

import type { FormEvent } from "react";

import { formBlocked, formOperationId, loyaltyFormError } from "../services/forms";
import type { StaffFormProps } from "../types/loyalty";
import { redeemSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function RedeemForm({ card, operation }: StaffFormProps) {
  const disabled = formBlocked(operation, "redeem", card.customerId) || !card.programEnabled || !card.rewardProductAvailable || card.cardStatus !== "active" || card.availableRewards.length === 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const form = new FormData(event.currentTarget);
    const parsed = redeemSchema.safeParse({ customerId: card.customerId, operationId: formOperationId(operation), rewardId: form.get("rewardId"), laterVisitConfirmed: form.get("laterVisitConfirmed") === "on", productAvailableConfirmed: form.get("productAvailableConfirmed") === "on" });
    if (!parsed.success) { operation.setError(loyaltyFormError(parsed.error)); return; }
    await operation.run("redeem", parsed.data);
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Canjear un premio</h2><p>Sin compra obligatoria. El canje no suma sellos ni reduce el progreso del ciclo.</p>
    {!card.rewardProductAvailable && <p>Producto agotado: conserva el premio disponible y consulta cocina antes de registrar.</p>}
    <fieldset disabled={disabled} className="space-y-4">
      <SelectField id="rewardId" name="rewardId" label="Premio disponible" defaultValue={operation.journal?.rewardId ?? ""} required><option value="">Selecciona el premio</option>{card.availableRewards.map((reward) => <option key={reward.id} value={reward.id}>Premio {reward.ordinal} · {reward.name}</option>)}</SelectField>
      <CheckboxField id="laterVisitConfirmed" name="laterVisitConfirmed" label="Es otra visita posterior a la que generó el premio" />
      <CheckboxField id="productAvailableConfirmed" name="productAvailableConfirmed" label="Cocina confirmó que el premio puede entregarse" />
    </fieldset>
    <SubmitButton pending={operation.pending && operation.journal?.kind === "redeem"} label={operation.journal?.kind === "redeem" ? "Reintentar este canje" : "Registrar canje"} pendingLabel="Registrando canje…" disabled={disabled} />
    <p className="text-sm text-brand-muted">Entrega el premio tras el resultado confirmado. Si un canje registrado no se entrega, registra la incidencia; no intentes canjear otro premio para corregirlo.</p>
  </form>;
}
