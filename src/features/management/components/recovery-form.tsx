"use client";

import Image from "next/image";
import type { FormEvent } from "react";

import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { RecoveryFormProps } from "../types/management";
import { recoverSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function RecoveryForm({ card, history, operation }: RecoveryFormProps) {
  const visits = history.events.filter((event) => event.type === "stamp_credited" && !event.reversed && event.visitReference);
  const disabled = managementBlocked(operation, "recover") || visits.length === 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const values = new FormData(event.currentTarget);
    const parsed = recoverSchema.safeParse({ customerId: card.customerId, expectedRevision: card.profileRevision, operationId: operation.journal?.operationId ?? crypto.randomUUID(), reference: values.get("proofReference"), historyEventId: values.get("historyEventId"),
      inPersonConfirmed: values.get("inPersonConfirmed") === "on", identityCheckedConfirmed: values.get("identityCheckedConfirmed") === "on", reason: values.get("recoveryReason") });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "recover")); return; }
    await operation.run("recover", parsed.data);
  }
  return <section className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Recuperación presencial de tarjeta</h2><p>Solo el responsable verifica al titular con comprobante e historial. El teléfono declarado no basta. Se invalidan los enlaces anteriores sin cambiar identidad, progreso ni premios.</p>
    {visits.length === 0 && <p>No hay una visita con referencia verificable en los movimientos cargados. Consulta movimientos anteriores; sin evidencia suficiente, no recuperes la tarjeta.</p>}
    <form method="post" onSubmit={submit} noValidate className="space-y-4"><fieldset disabled={disabled} className="space-y-4">
      <SelectField id="historyEventId" name="historyEventId" label="Movimiento contrastado con el comprobante"><option value="">Selecciona una visita con referencia</option>{visits.map((event) => <option key={event.id} value={event.id}>{event.visitReference}</option>)}</SelectField>
      <TextField id="proofReference" name="proofReference" label="Referencia del comprobante presentado" maxLength={80} required />
      <TextField id="recoveryReason" name="recoveryReason" label="Motivo de recuperación" minLength={10} maxLength={500} required />
      <CheckboxField id="inPersonConfirmed" name="inPersonConfirmed" label="El titular está presente en el local" /><CheckboxField id="identityCheckedConfirmed" name="identityCheckedConfirmed" label="Verifiqué la titularidad comparando comprobante e historial" />
    </fieldset><SubmitButton label="Invalidar enlace anterior y recuperar acceso" pendingLabel="Recuperando acceso privado…" pending={operation.pending && operation.journal?.kind === "recover"} disabled={disabled} /></form>
    {operation.recoveryLink && <div className="space-y-4"><p role="status">Nuevo enlace privado preparado. Entrégalo únicamente al titular presente y pídele guardarlo; no lo compartas ni captures.</p>
      <TextField id="recoveredLink" label="Nuevo enlace privado del cliente" value={operation.recoveryLink.link} readOnly />
      <Image src={operation.recoveryLink.qr} alt="QR privado de la tarjeta recuperada" width={256} height={256} unoptimized className="h-auto max-w-full" />
    </div>}
  </section>;
}
