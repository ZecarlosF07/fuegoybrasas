"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { IncidentEditor } from "./incident-editor";
import { ManagementFeedback } from "./operation-feedback";
import { useManagementOperation } from "../hooks/use-management-operation";
import { getIncidentsAction } from "../server/actions";
import { displayDate } from "../services/dates";
import type { Incidents, IncidentsProps } from "../types/management";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function IncidentsPanel({ initial, actorUserId }: IncidentsProps) {
  const [data, setData] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("open");
  const work = useServerWork<Incidents>();
  async function reload() {
    const result = await getIncidentsAction({ status, includeDeleted: true });
    if (!result.ok) throw new Error("No pudimos cargar las incidencias actuales.");
    setData(result.data);
  }
  const operation = useManagementOperation(actorUserId, reload);
  async function query(nextStatus: string, cursor: string | null = null) {
    const result = await work.execute(() => getIncidentsAction({ status: nextStatus, cursor, includeDeleted: true }));
    if (result?.ok) { setData(result.data); setStatus(nextStatus); setSelectedId(null); }
  }
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void query(String(new FormData(event.currentTarget).get("status"))); }
  const selected = data.incidents.find((incident) => incident.id === selectedId);
  return <div className="space-y-6">
    <h1 className="font-brand text-3xl font-bold">Incidencias de fidelización</h1><p>Revisar o cerrar un caso no corrige automáticamente un sello ni devuelve un premio.</p>
    <ManagementFeedback operation={operation} /><FormFeedback error={work.error} />
    <form method="post" onSubmit={filter} className="flex flex-wrap items-end gap-4"><SelectField id="status" name="status" label="Estado de las incidencias" disabled={work.pending || operation.pending || operation.journal !== null}><option value="open">Abiertas</option><option value="closed">Cerradas y retiradas</option><option value="all">Todas</option></SelectField><SubmitButton label="Consultar incidencias" pendingLabel="Consultando incidencias…" pending={work.pending} disabled={operation.pending || operation.journal !== null} /></form>
    {data.incidents.length === 0 && <p role="status">No hay incidencias para este filtro.</p>}
    <ul className="grid gap-4 lg:grid-cols-2">{data.incidents.map((incident) => <li key={incident.id} className="space-y-3 rounded-card border border-brand-border bg-brand-surface p-4">
      <h2 className="text-xl font-bold">{incident.displayName ?? "Cliente"}</h2><p>{incident.type === "reward_delivery_failed" ? "Premio registrado sin entrega" : incident.type === "correction_requires_review" ? "Corrección sobre premio canjeado" : "Otra incidencia"}</p>
      <p>{incident.deleted ? "Retirada" : incident.status === "open" ? "Abierta" : "Cerrada"} · {displayDate(incident.createdAt)}</p>
      <Link href={"/administracion/clientes/" + incident.customerId} className="flex min-h-12 items-center text-brand-action underline">Ver tarjeta e historial</Link>
      <Button variant="secondary" disabled={operation.pending || operation.journal !== null} onClick={() => setSelectedId(incident.id)}>Revisar incidencia</Button>
    </li>)}</ul>
    {data.nextCursor && <Button variant="secondary" disabled={work.pending || operation.pending || operation.journal !== null} aria-busy={work.pending} onClick={() => query(status, data.nextCursor)}>{work.pending ? "Consultando incidencias…" : "Ver siguientes incidencias"}</Button>}
    {selected && <IncidentEditor key={selected.id + ":" + selected.revision} incident={selected} operation={operation} />}
  </div>;
}
