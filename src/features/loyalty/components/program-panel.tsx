"use client";

import { useState } from "react";

import { ProgramEditor } from "./program-editor";
import { useLoyaltyOperation } from "../hooks/use-loyalty-operation";
import { getProgramsAction } from "../server/program-actions";
import type { ProgramPanelProps } from "../types/loyalty";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";

export function ProgramPanel({ initial, actorUserId, launchReady }: ProgramPanelProps) {
  const [data, setData] = useState(initial);
  async function reload() {
    const result = await getProgramsAction();
    if (!result.ok) throw new Error("No se pudo actualizar el programa.");
    setData(result.data);
  }
  const operation = useLoyaltyOperation(actorUserId, reload);
  return <section className="max-w-3xl space-y-6 border-t border-brand-border pt-8">
    <h2 className="font-brand text-3xl font-bold">Tarjeta de fidelización</h2>
    <p>{data.enabled ? "Programa habilitado. Los derechos y la disponibilidad se revisan en cada operación." : "Programa pausado. Se conservan las tarjetas y sus premios."}</p>
    <FormFeedback error={operation.error} message={operation.message} />
    {operation.journal && <div className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4">
      <p>Hay una operación pendiente de comprobación. No inicies otra.</p><p className="break-all text-sm">{operation.journal.operationId}</p>
      <Button disabled={operation.pending} aria-busy={operation.pending} onClick={operation.check}>{operation.pending ? "Comprobando resultado…" : "Comprobar operación de tarjeta"}</Button>
    </div>}
    <Button variant="secondary" disabled={operation.pending || operation.journal !== null} aria-busy={operation.pending} onClick={operation.refresh}>{operation.pending ? "Consultando programa…" : "Consultar programa actual"}</Button>
    {data.programs.map((program) => <ProgramEditor key={program.id + ":" + program.revision} program={program} operation={operation} launchReady={launchReady} />)}
    <p className="text-sm text-brand-muted">No se modifican meta ni contenido de una versión utilizada. Recuperación, baja y resolución de canjes sin entrega se completan con el responsable.</p>
  </section>;
}
