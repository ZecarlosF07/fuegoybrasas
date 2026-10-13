"use client";

import type { FormEvent } from "react";

import { displayDate } from "../services/dates";
import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { HistoryProps } from "../types/management";
import { reverseSchema } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { LOYALTY_EVENT_LABELS } from "@/features/loyalty/constants";

export function CustomerHistory({ history, operation, onMore, loading }: HistoryProps) {
  const eligible = history.events.filter((event) => event.type === "stamp_credited" && !event.reversed);
  const disabled = managementBlocked(operation, "reverse") || eligible.length === 0 || loading;
  async function reverse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const values = new FormData(event.currentTarget);
    const parsed = reverseSchema.safeParse({ customerId: history.customerId, eventId: values.get("eventId"), reason: values.get("reverseReason"), operationId: operation.journal?.operationId ?? crypto.randomUUID() });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "reverse")); return; }
    await operation.run("reverse", parsed.data);
  }
  return <section className="space-y-4" aria-labelledby="history-title">
    <h2 id="history-title" className="text-2xl font-bold">Historial completo de movimientos</h2>
    <p className="text-brand-muted">Los hechos originales se conservan. El identificador del empleado permite rastrear cada intervención.</p>
    {history.events.length === 0 && <p>Aún no hay movimientos.</p>}
    <ol className="space-y-4">{history.events.map((event) => <li key={event.id} className="space-y-2 rounded-card border border-brand-border bg-brand-surface p-4">
      <p className="font-bold">{LOYALTY_EVENT_LABELS[event.type]}{event.reversed ? " · Revertido" : ""}</p><p>Fecha de atención: {displayDate(event.occurredAt)}</p><p className="text-sm text-brand-muted">Registrado: {displayDate(event.recordedAt)}</p>
      <p className="break-all text-sm">Empleado: {event.actorStaffId} · {event.actorRole === "manager" ? "Responsable" : "Atención"}</p>
      {event.visitReference && <p>Referencia: {event.visitReference}</p>}{event.reason && <p>Motivo: {event.reason}</p>}
      {event.reversesEventId && <p className="break-all text-sm">Revierte el movimiento: {event.reversesEventId}</p>}
      {event.reinstatesEventId && <p className="break-all text-sm">Restituye el canje no entregado: {event.reinstatesEventId}</p>}
    </li>)}</ol>
    {history.nextCursor && <Button disabled={loading || operation.pending || operation.journal !== null} aria-busy={loading} onClick={onMore}>{loading ? "Consultando historial…" : "Consultar movimientos anteriores"}</Button>}
    <form method="post" noValidate onSubmit={reverse} className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4 md:p-6">
      <h3 className="text-xl font-bold">Revertir un sello registrado por error</h3><p>Se resta un sello y se anula el premio pendiente afectado. Si el premio ya fue canjeado, se registra una incidencia sin cambiar el saldo.</p>
      <fieldset disabled={disabled} className="space-y-4">
        <SelectField id="eventId" name="eventId" label="Sello original"><option value="">Selecciona el movimiento</option>{eligible.map((event) => <option key={event.id} value={event.id}>{displayDate(event.occurredAt)} · {event.visitReference ?? event.id.slice(0, 8)}</option>)}</SelectField>
        <TextField id="reverseReason" name="reverseReason" label="Motivo de la reversión" minLength={10} maxLength={500} required />
      </fieldset>
      <SubmitButton label="Confirmar reversión de un sello" pendingLabel="Revisando y corrigiendo sello…" pending={operation.pending && operation.journal?.kind === "reverse"} disabled={disabled} />
    </form>
  </section>;
}
