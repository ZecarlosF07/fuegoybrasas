"use client";

import type { FormEvent } from "react";

import { formBlocked, formOperationId, loyaltyFormError } from "../services/forms";
import type { ProgramEditorProps } from "../types/loyalty";
import { availabilitySchema, costSchema, programActivationSchema } from "../validation/schemas";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { parseSolesToCents } from "@/lib/money/utils";

export function ProgramEditor({ program, operation, launchReady }: ProgramEditorProps) {
  const kind = program.status === "draft" ? "activate" : "cost";
  const disabled = formBlocked(operation, kind) || (kind === "activate" && !launchReady);
  async function costSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled) return;
    const form = new FormData(event.currentTarget);
    let costCents: number;
    try { costCents = parseSolesToCents(String(form.get("costCents") ?? "")); }
    catch { operation.setError({ code: "VALIDATION_ERROR", message: "Escribe el costo real en soles, con hasta dos decimales.", fieldErrors: { costCents: ["El costo no puede quedar vacío."] } }); return; }
    const base = { programId: program.id, expectedRevision: program.revision, operationId: formOperationId(operation), costCents };
    const checks = { costConfirmed: form.get("costConfirmed") === "on", termsApproved: form.get("termsApproved") === "on", privacyApproved: form.get("privacyApproved") === "on", accessTested: form.get("accessTested") === "on", staffReady: form.get("staffReady") === "on" };
    const parsed = kind === "activate" ? programActivationSchema.safeParse({ ...base, termsVersion: program.termsVersion, checks }) : costSchema.safeParse(base);
    if (!parsed.success) { operation.setError(loyaltyFormError(parsed.error)); return; }
    await operation.run(kind, parsed.data);
  }
  async function stockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = availabilitySchema.safeParse({ programId: program.id, expectedRevision: program.revision, operationId: formOperationId(operation), available: new FormData(event.currentTarget).get("available") === "on" });
    if (!parsed.success) { operation.setError(loyaltyFormError(parsed.error)); return; }
    await operation.run("availability", parsed.data);
  }
  return <article className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h3 className="text-xl font-bold">{program.rewardName} · diez sellos</h3><p>{program.rewardContents.join(" · ")}</p>
    <p>Estado: {program.status === "draft" ? "borrador" : program.status === "active" ? "activo" : "retirado con derechos conservados"}. Revisión {program.revision}.</p>
    <form method="post" onSubmit={costSubmit} noValidate className="space-y-4">
      <TextField id="costCents" name="costCents" label="Costo real del premio (soles)" inputMode="decimal" defaultValue={program.costCents === null ? "" : (program.costCents / 100).toFixed(2)} disabled={disabled} help="Ingredientes, preparación, empaque y acompañamientos. No uses el precio de venta." />
      {kind === "activate" && <fieldset disabled={disabled} className="space-y-4"><legend className="mb-4 font-semibold">Confirmaciones antes de activar</legend>
        <CheckboxField id="costConfirmed" name="costConfirmed" label="Costo real confirmado por el responsable" />
        <CheckboxField id="termsApproved" name="termsApproved" label="Condiciones vigentes aprobadas por el negocio" />
        <CheckboxField id="privacyApproved" name="privacyApproved" label="Aviso y conservación de datos aprobados" />
        <CheckboxField id="accessTested" name="accessTested" label="Alta sin SMS, enlace privado y cambio de contacto probados" />
        <CheckboxField id="staffReady" name="staffReady" label="Personal autorizado y preparado para acreditar y canjear" />
      </fieldset>}
      {kind === "activate" && !launchReady && <p>La activación está bloqueada: faltan confirmaciones de acceso privado y documentos aprobados.</p>}
      <SubmitButton pending={operation.pending && operation.journal?.kind === kind} label={kind === "activate" ? "Activar programa y nuevas tarjetas" : "Guardar costo de referencia"} pendingLabel="Guardando programa…" disabled={disabled} />
    </form>
    <form method="post" onSubmit={stockSubmit} className="space-y-4"><CheckboxField id="available" name="available" label="Cocina confirma disponibilidad del premio" defaultChecked={program.available} disabled={formBlocked(operation, "availability")} />
      <SubmitButton pending={operation.pending && operation.journal?.kind === "availability"} label="Guardar disponibilidad del premio" pendingLabel="Guardando disponibilidad…" disabled={formBlocked(operation, "availability")} />
    </form>
  </article>;
}
