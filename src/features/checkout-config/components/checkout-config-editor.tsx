"use client";

import { useRef } from "react";
import type { FormEvent } from "react";

import { CheckoutConfigFields, invalidateCheckoutVerification } from "./checkout-config-fields";
import { saveCheckoutConfigAction } from "../server/actions";
import { checkoutFormPatch } from "../services/form";
import type { CheckoutEditorProps } from "../types/config";
import { paymentFields, zoneFields } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { useCatalogOperation } from "@/features/catalog-admin/hooks/use-catalog-operation";

export function CheckoutConfigEditor({ selection, configRevision, actorUserId, onSaved, onBusyChange }: CheckoutEditorProps) {
  const work = useCatalogOperation(actorUserId, onSaved, onBusyChange, saveCheckoutConfigAction);
  const reason = useRef<HTMLInputElement>(null);
  const { entityType, entityId, row, creating } = selection;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (work.pending) return;
    try {
      const patch = checkoutFormPatch(entityType, new FormData(event.currentTarget));
      const parsed = (entityType === "payment_method" ? paymentFields : zoneFields).safeParse(patch);
      if (!parsed.success) { work.setError({ code: "VALIDATION_ERROR", message: "Revisa los campos indicados.", fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), [issue.message]])) }); return; }
      await work.run("save", { entityType, entityId, expectedRevision: row.revision ?? 0, configRevision, patch: parsed.data, operationId: crypto.randomUUID() });
    } catch { work.setError({ code: "VALIDATION_ERROR", message: "Revisa los importes: usa soles con hasta dos decimales." }); }
  }
  async function conserve() {
    const justification = reason.current?.value.trim() ?? "";
    if (justification.length < 10 || justification.length > 500) { work.setError({ code: "VALIDATION_ERROR", message: "Escribe un motivo entre 10 y 500 caracteres." }); return; }
    await work.run(row.deleted_at ? "restore" : "delete", { entityType, entityId, expectedRevision: row.revision ?? 0, reason: justification, operationId: crypto.randomUUID() });
  }
  return <section aria-label="Editor de condiciones" className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h3 className="text-xl font-semibold">{creating ? "Crear" : "Editar"} {entityType === "payment_method" ? "medio de pago" : "zona"}</h3>
    <p>Versión del local {configRevision}; registro {row.revision ?? "nuevo"}.</p>
    <FormFeedback error={work.error} message={work.message} />
    {work.journal && <div className="space-y-3"><p>Operación pendiente: <span className="break-all">{work.journal.operationId}</span>. Comprueba el resultado antes de otra acción.</p><Button disabled={work.pending} aria-busy={work.pending} onClick={work.check}>{work.pending ? "Comprobando resultado…" : "Comprobar resultado"}</Button></div>}
    {!row.deleted_at && <form method="post" onSubmit={save} onChange={invalidateCheckoutVerification} noValidate className="space-y-4"><CheckoutConfigFields selection={selection} disabled={work.pending} errors={work.error?.fieldErrors} /><SubmitButton pending={work.pending} label={work.journal ? "Reintentar el mismo guardado" : "Guardar condiciones"} pendingLabel="Guardando condiciones…" disabled={!work.ready} /></form>}
    {!creating && <div className="space-y-3 border-t border-brand-border pt-4"><h4 className="font-semibold">{row.deleted_at ? "Restaurar" : "Retirar"} condiciones</h4><p>{row.deleted_at ? "Se restaurará deshabilitado y sin verificación." : "Se conservará el historial. Los pedidos preparados deberán revisar las condiciones actuales."}</p>{row.delete_reason && <p>Motivo anterior: {row.delete_reason}</p>}<TextField ref={reason} id="reason" label="Motivo (10–500 caracteres)" maxLength={500} disabled={work.pending} /><Button variant="secondary" onClick={conserve} disabled={work.pending || !work.ready} aria-busy={work.pending}>{work.pending ? "Aplicando acción…" : row.deleted_at ? "Confirmar restauración" : "Confirmar retiro"}</Button></div>}
  </section>;
}
