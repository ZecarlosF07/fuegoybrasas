"use client";

import type { FormEvent } from "react";

import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { IncidentEditorProps } from "../types/management";
import { closeIncidentSchema, reinstateSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextareaField } from "@/components/ui/textarea-field";
import { conservationSchema } from "@/features/staff/validation/schemas";

export function IncidentEditor({ incident, operation }: IncidentEditorProps) {
  const kind = incident.status === "open" ? incident.type === "reward_delivery_failed" ? "reinstate" : "close" : incident.deleted ? "restore" : "delete";
  const disabled = managementBlocked(operation, kind);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const values = new FormData(event.currentTarget);
    const reason = values.get("resolutionNote");
    const identity = { expectedRevision: incident.revision, operationId: operation.journal?.operationId ?? crypto.randomUUID() };
    const parsed = kind === "reinstate" ? reinstateSchema.safeParse({ ...identity, incidentId: incident.id, reason, notDeliveredConfirmed: values.get("notDeliveredConfirmed") === "on" }) : kind === "close" ? closeIncidentSchema.safeParse({ ...identity, incidentId: incident.id, resolutionNote: reason }) : conservationSchema.safeParse({ ...identity, entityType: "loyalty_incident", entityId: incident.id, reason });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, kind)); return; }
    await operation.run(kind, parsed.data);
  }
  return <form method="post" noValidate onSubmit={submit} className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Revisar incidencia de {incident.displayName ?? "cliente"}</h2>
    <p>{incident.description}</p><p>Estado: {incident.deleted ? "Retirada, con historial conservado" : incident.status === "open" ? "Abierta" : "Cerrada"}</p>
    {incident.resolutionNote && <p>Nota registrada: {incident.resolutionNote}</p>}
    {kind === "reinstate" && <><p>Se restituye el mismo premio disponible sin sumar sellos. El canje original permanece en historial y esta incidencia se cierra.</p><CheckboxField id="notDeliveredConfirmed" name="notDeliveredConfirmed" label="Comprobé que este premio no fue entregado físicamente" disabled={disabled} /></>}
    <TextareaField id="resolutionNote" name="resolutionNote" label={kind === "reinstate" ? "Motivo de restitución del premio" : kind === "close" ? "Nota de resolución (sin cambio de saldo)" : "Motivo de retiro o restauración"} minLength={10} maxLength={500} required disabled={disabled} />
    <SubmitButton label={kind === "reinstate" ? "Restituir premio no entregado" : kind === "close" ? "Cerrar incidencia sin cambiar saldo" : kind === "restore" ? "Restaurar incidencia cerrada" : "Retirar incidencia cerrada"} pendingLabel="Registrando intervención…" pending={operation.pending} disabled={disabled} />
  </form>;
}
