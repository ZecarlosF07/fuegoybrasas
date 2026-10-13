"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormFeedback } from "@/components/ui/form-feedback";
import type { OperationError } from "@/contracts/types/result";
import { CatalogList } from "@/features/catalog-admin/components/catalog-list";
import { EntityEditor } from "@/features/catalog-admin/components/entity-editor";
import { RelatedRecords } from "@/features/catalog-admin/components/related-records";
import { getAdminCatalogAction } from "@/features/catalog-admin/server/actions";
import { newEntityRow } from "@/features/catalog-admin/services/fields";
import { readCatalogJournal } from "@/features/catalog-admin/services/journal";
import { entityRows, selectEntity, selectionItem } from "@/features/catalog-admin/services/selection";
import type { AdminPanelProps, CatalogEntityType, EntitySelection } from "@/features/catalog-admin/types/catalog-admin";
import type { StaffConflict } from "@/features/staff/types/staff";

export function AdminCatalogPanel({ initial, actorUserId }: AdminPanelProps) {
  const [catalog, setCatalog] = useState(initial);
  const [selection, setSelection] = useState<EntitySelection | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<OperationError<StaffConflict> | null>(null);
  const busy = useRef(false);
  const operationBusy = useRef(false);
  const [operating, setOperating] = useState(false);
  const itemId = selectionItem(selection, catalog);
  function choose(value: EntitySelection) {
    if (busy.current || operationBusy.current) return;
    try {
      const journal = readCatalogJournal(actorUserId);
      if (journal && (journal.entityId !== value.entityId || journal.entityType !== value.entityType)) { setError({ code: "OPERATION_UNCERTAIN", message: "Resuelve la operación pendiente del editor actual antes de cambiar de registro." }); return; }
      setSelection(value); setError(null); setMessage(null);
    } catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos comprobar las operaciones pendientes. Habilita el almacenamiento de esta pestaña." }); }
  }
  function setOperationBusy(value: boolean) { operationBusy.current = value; setOperating(value); if (value) setMessage(null); }
  function create(type: CatalogEntityType, parentId?: string) {
    const entityId = type === "promotion" && parentId ? parentId : crypto.randomUUID();
    choose({ entityType: type, entityId, row: newEntityRow(type, parentId), creating: true });
  }
  async function reload(notice?: string) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try {
      const result = await getAdminCatalogAction(true);
      if (!result.ok) { setError(result.error); return; }
      setCatalog(result.data);
      const row = selection ? entityRows(result.data, selection.entityType).find((entry) => (selection.entityType === "promotion" ? entry.item_id : entry.id) === selection.entityId) : null;
      if (selection && row) setSelection(selectEntity(selection.entityType, row));
      setMessage(notice ?? "Versión actual cargada. Revisa los datos antes de guardar.");
    } catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos cargar la carta. El formulario conserva su contenido." }); }
    finally { busy.current = false; setPending(false); }
  }
  async function discardAndReload() {
    try { if (readCatalogJournal(actorUserId)) { setError({ code: "OPERATION_UNCERTAIN", message: "Comprueba primero la operación pendiente." }); return; } }
    catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos leer las operaciones pendientes." }); return; }
    await reload();
  }
  return <div className="space-y-6">
    <div><h1 className="font-brand text-3xl font-bold">Administrar carta</h1><p className="mt-3 max-w-3xl text-brand-muted">Precios, promociones y disponibilidad del local. Guarda borradores y publica cuando sus datos estén confirmados. Los cambios quedan registrados con tu cuenta.</p></div>
    <FormFeedback error={error} message={message} />
    <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={pending || operating} onClick={() => create("category")}>Nueva categoría</Button><Button disabled={pending || operating} onClick={() => create("catalog_item")}>Nuevo producto</Button><Button variant="secondary" disabled={pending || operating} aria-busy={pending} onClick={discardAndReload}>{pending ? "Cargando carta…" : "Descartar cambios y cargar versión actual"}</Button></div>
    <CheckboxField id="show-deleted" label="Mostrar registros retirados" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <details open={!selection} className="min-w-0 rounded-card border border-brand-border p-4"><summary className="min-h-12 cursor-pointer py-3 font-semibold">Seleccionar producto o categoría</summary><CatalogList catalog={catalog} disabled={pending || operating} showDeleted={showDeleted} onSelect={choose} /></details>
      <div className="min-w-0 space-y-6">{selection ? <EntityEditor key={`${selection.entityType}:${selection.entityId}:${selection.row.revision}`} selection={selection} catalog={catalog} actorUserId={actorUserId} onSaved={reload} onBusyChange={setOperationBusy} /> : <p className="rounded-card border border-brand-border bg-brand-surface p-6">Selecciona un producto para revisar su contenido, precios, promoción y opciones.</p>}
        {itemId && <RelatedRecords catalog={catalog} itemId={itemId} showDeleted={showDeleted} disabled={pending || operating} onSelect={choose} onCreate={create} />}
      </div>
    </div>
  </div>;
}
