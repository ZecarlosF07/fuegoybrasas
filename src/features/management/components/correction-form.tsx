"use client";

import type { FormEvent } from "react";

import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { CorrectionProps } from "../types/management";
import { correctionSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";

export function CorrectionForm({ card, operation }: CorrectionProps) {
  const disabled = managementBlocked(operation, "correct");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const values = new FormData(event.currentTarget);
    const parsed = correctionSchema.safeParse({ customerId: card.customerId, expectedRevision: card.profileRevision, operationId: operation.journal?.operationId ?? crypto.randomUUID(),
      displayName: values.get("displayName"), frequentInstructions: values.get("frequentInstructions"), customerRequestConfirmed: values.get("customerRequestConfirmed") === "on", reason: values.get("reason") });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "correct")); return; }
    await operation.run("correct", parsed.data);
  }
  return <form method="post" noValidate onSubmit={submit} className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Corregir datos por solicitud</h2><p>Esta intervención no cambia el contacto, los sellos ni los premios.</p>
    <fieldset disabled={disabled} className="space-y-4">
      <TextField id="displayName" name="displayName" label="Nombre solicitado" defaultValue={card.displayName} maxLength={80} required />
      <TextareaField id="frequentInstructions" name="frequentInstructions" label="Indicaciones habituales solicitadas" defaultValue={card.frequentInstructions} maxLength={500} />
      <TextField id="reason" name="reason" label="Motivo de la corrección" minLength={10} maxLength={500} required help="Describe el motivo sin copiar datos de contacto ni información personal innecesaria." />
      <CheckboxField id="customerRequestConfirmed" name="customerRequestConfirmed" label="El cliente solicitó expresamente esta corrección" />
    </fieldset>
    <SubmitButton label="Guardar corrección solicitada" pendingLabel="Guardando corrección…" pending={operation.pending && operation.journal?.kind === "correct"} disabled={disabled} />
  </form>;
}
