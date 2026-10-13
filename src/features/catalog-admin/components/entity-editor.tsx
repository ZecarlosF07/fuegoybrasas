"use client";

import { useRef } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { EntityFields } from "@/features/catalog-admin/components/entity-fields";
import { ImageEditor } from "@/features/catalog-admin/components/image-editor";
import { ENTITY_LABELS } from "@/features/catalog-admin/constants";
import { useCatalogOperation } from "@/features/catalog-admin/hooks/use-catalog-operation";
import { entityFormPatch } from "@/features/catalog-admin/services/fields";
import { publicationIssues } from "@/features/catalog-admin/services/publication";
import type { EntityEditorProps } from "@/features/catalog-admin/types/catalog-admin";
import { createSchemas, patchSchemas } from "@/features/catalog-admin/validation/schemas";

export function EntityEditor({ selection, catalog, actorUserId, onSaved, onBusyChange }: EntityEditorProps) {
  const { entityType, entityId, row, creating } = selection;
  const work = useCatalogOperation(actorUserId, onSaved, onBusyChange);
  const form = useRef<HTMLFormElement>(null);
  const reason = useRef<HTMLInputElement>(null);
  const issues = entityType === "catalog_item" ? publicationIssues({ ...row, id: entityId }, catalog) : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (work.pending || !work.ready) return;
    let patch: Record<string, unknown>;
    try { patch = entityFormPatch(entityType, new FormData(event.currentTarget), row, creating); }
    catch { work.setError({ code: "VALIDATION_ERROR", message: "Revisa los importes: usa soles con hasta dos decimales.", fieldErrors: { price_cents: ["Importe inválido."] } }); return; }
    const parsed = (creating ? createSchemas[entityType] : patchSchemas[entityType]).safeParse(patch);
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), [issue.message]]));
      work.setError({ code: "VALIDATION_ERROR", message: "Revisa los campos indicados.", fieldErrors: fields }); return;
    }
    if (!Object.keys(parsed.data).length) { work.setError({ code: "VALIDATION_ERROR", message: "No hay cambios para guardar." }); return; }
    await work.run("save", { entityType, entityId, expectedRevision: row.revision, patch: parsed.data, operationId: crypto.randomUUID() });
  }
  async function conserve() {
    const justification = reason.current?.value.trim() ?? "";
    if (justification.length < 10 || justification.length > 500) { work.setError({ code: "VALIDATION_ERROR", message: "Escribe un motivo de 10 a 500 caracteres.", fieldErrors: { reason: ["Explica el motivo de esta acción."] } }); return; }
    await work.run(row.deleted_at ? "restore" : "delete", { entityType, entityId, expectedRevision: row.revision, reason: justification, operationId: crypto.randomUUID() });
  }
  async function associate(imagePath: string | null) {
    await work.run("save", { entityType, entityId, expectedRevision: row.revision, patch: { image_path: imagePath }, operationId: crypto.randomUUID() });
  }
  function invalidateContent(event: FormEvent<HTMLFormElement>) {
    if (!(event.target instanceof HTMLElement)) return;
    const field = event.target.getAttribute("name") ?? "";
    const names = entityType === "catalog_item" ? ["name", "kind", "portion_label", "inclusions", "description"] : entityType === "catalog_price" ? ["price_cents"] : entityType === "option_group" ? ["name", "min_choices", "max_choices"] : ["label", "extra_price_cents"];
    if (!names.includes(field)) return;
    const checkbox = form.current?.elements.namedItem(entityType === "catalog_item" ? "content_verified" : "verified");
    if (checkbox instanceof HTMLInputElement) checkbox.checked = false;
  }
  return <section aria-label="Editor de carta" className="min-w-0 space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <div><h2 className="text-2xl font-bold">{creating ? "Crear" : "Editar"} {ENTITY_LABELS[entityType].toLowerCase()}</h2><p className="mt-2 font-semibold">{String(row.name ?? row.label ?? row.mode ?? "")}</p><p className="mt-2 text-brand-muted">{creating ? "Registro nuevo: comienza sin publicación automática." : `Versión ${row.revision}. ${row.deleted_at ? "Retirado" : "Vigente"}.`}</p></div>
    <FormFeedback error={work.error} message={work.message} />
    {work.journal && <div className="space-y-3 rounded-field border border-brand-control-border p-4"><p>Operación pendiente: <span className="break-all">{work.journal.operationId}</span>. Comprueba su resultado antes de iniciar otra.</p><Button onClick={work.check} disabled={work.pending} aria-busy={work.pending}>{work.pending ? "Comprobando operación…" : "Comprobar resultado"}</Button></div>}
    {issues.length > 0 && <details><summary className="min-h-12 cursor-pointer py-3 font-semibold">Requisitos pendientes para publicar</summary><ul className="list-inside list-disc space-y-2 text-brand-muted">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></details>}
    {!row.deleted_at && <form method="post" ref={form} onSubmit={submit} onChange={invalidateContent} noValidate className="space-y-6">
      <EntityFields entityType={entityType} row={row} catalog={catalog} creating={creating} disabled={work.pending} errors={work.error?.fieldErrors} />
      <SubmitButton pending={work.pending} label={work.journal?.kind === "save" ? "Reintentar el mismo guardado" : "Guardar cambios"} pendingLabel="Guardando cambios…" disabled={!work.ready || work.pending} />
    </form>}
    {!creating && entityType === "catalog_item" && !row.deleted_at && <ImageEditor itemId={entityId} actorUserId={actorUserId} currentPath={typeof row.image_path === "string" ? row.image_path : null} disabled={work.pending || Boolean(work.journal)} onAssociate={associate} onBusyChange={onBusyChange} />}
    {!creating && <div className="space-y-4 border-t border-brand-border pt-6">
      <h3 className="font-semibold">{row.deleted_at ? "Restaurar registro" : "Retirar registro"}</h3>
      <p className="text-brand-muted">{row.deleted_at ? "Se conserva la identidad y vuelve sin publicación ni verificación automática. Revisa también sus elementos relacionados." : "Se ocultará este registro. Los relacionados y el historial se conservan; el retiro puede bloquearse si deja un producto publicado incompleto."}</p>
      {row.delete_reason && <p className="break-words">Motivo del retiro: {row.delete_reason}</p>}
      <TextField ref={reason} id="reason" label="Motivo de la acción" maxLength={500} disabled={work.pending} error={work.error?.fieldErrors?.reason?.[0]} />
      <Button variant="secondary" onClick={conserve} disabled={work.pending || !work.ready} aria-busy={work.pending}>{work.pending ? "Aplicando acción…" : row.deleted_at ? "Confirmar restauración" : "Confirmar retiro"}</Button>
    </div>}
  </section>;
}
