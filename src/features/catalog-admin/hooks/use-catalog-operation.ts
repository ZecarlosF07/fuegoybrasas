"use client";

import { useEffect, useRef, useState } from "react";

import { saveCatalogEntityAction } from "../server/actions";
import { catalogFingerprint, clearCatalogJournal, readCatalogJournal, writeCatalogJournal } from "../services/journal";
import type { Journal } from "../types/catalog-admin";
import type { CatalogOperationInput, CatalogOperationKind, CatalogSaveAction } from "../types/operation";
import type { OperationError } from "@/contracts/types/result";
import { getOperationAction, restoreEntityAction, softDeleteEntityAction } from "@/features/staff/server/actions";
import type { StaffConflict } from "@/features/staff/types/staff";

export function useCatalogOperation(actorUserId: string, onSaved: (message?: string) => Promise<void>, onBusyChange: (busy: boolean) => void, saveAction: CatalogSaveAction = saveCatalogEntityAction) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [error, setError] = useState<OperationError<StaffConflict> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setJournal(readCatalogJournal(actorUserId)); setReady(true); }
      catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos leer el registro local. Habilita el almacenamiento de esta pestaña antes de guardar." }); }
    });
    return () => { active = false; };
  }, [actorUserId]);
  function clear() { clearCatalogJournal(); setJournal(null); }
  async function run(kind: CatalogOperationKind, candidate: CatalogOperationInput) {
    if (running.current || !ready) return;
    running.current = true; onBusyChange(true); setPending(true); setError(null); setMessage(null);
    let confirmed = false;
    try {
      const input = { ...candidate, operationId: journal?.operationId ?? candidate.operationId, expectedRevision: journal?.expectedRevision ?? candidate.expectedRevision, ...("configRevision" in candidate ? { configRevision: journal?.configRevision ?? candidate.configRevision } : {}) };
      const fingerprint = await catalogFingerprint(input, kind);
      if (journal && (journal.kind !== kind || journal.fingerprint !== fingerprint)) { setError({ code: "IDEMPOTENCY_CONFLICT", message: "Hay una operación pendiente con otros datos. Consulta su resultado y conserva el identificador." }); return; }
      const record: Journal = journal ?? { actorUserId, entityId: input.entityId, entityType: input.entityType, expectedRevision: input.expectedRevision, operationId: input.operationId, fingerprint, createdAt: Date.now(), kind, ...("configRevision" in input ? { configRevision: input.configRevision } : {}) };
      writeCatalogJournal(record); setJournal(record);
      const result = await (kind === "save" ? saveAction(input) : kind === "restore" ? restoreEntityAction(input) : softDeleteEntityAction(input));
      if (!result.ok && !["OPERATION_UNCERTAIN", "IDEMPOTENCY_CONFLICT"].includes(result.error.code)) clear();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      confirmed = true;
      clear();
      const notice = mutationNotice(kind, input);
      setMessage(notice); await onSaved(notice);
    } catch { setError(confirmed ? { code: "SERVICE_UNAVAILABLE", message: "El cambio fue confirmado, pero no pudimos actualizar la lista. Carga la versión actual antes de otra edición." } : { code: "OPERATION_UNCERTAIN", message: "No pudimos comprobar el resultado. Conserva la referencia y consulta la operación antes de repetir." }); }
    finally { running.current = false; onBusyChange(false); setPending(false); }
  }
  async function check() {
    if (running.current || !journal) return;
    running.current = true; onBusyChange(true); setPending(true); setError(null);
    try {
      const result = await getOperationAction(journal.operationId);
      if (!result.ok) { setError(result.error); return; }
      if (result.data.status === "not_found") { setMessage("Aún no hay recibo confirmado. Conserva este identificador y reintenta la misma acción con los mismos datos."); return; }
      clear(); setMessage("Resultado registrado. Se cargó la versión actual para revisión."); await onSaved("Resultado registrado. Se cargó la versión actual para revisión.");
    } catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos consultar o limpiar la referencia local. Conserva el identificador y consulta al responsable." }); }
    finally { running.current = false; onBusyChange(false); setPending(false); }
  }
  return { pending, ready, journal, error, message, setError, run, check };
}
function mutationNotice(kind: CatalogOperationKind, input: CatalogOperationInput) {
  if (kind === "delete") return "Registro retirado. Se conserva su historial.";
  if (kind === "restore") return "Registro restaurado sin reactivación automática. Revisa sus datos y descendientes.";
  if ("patch" in input && "image_path" in input.patch) return input.patch.image_path ? "Foto asociada al producto. Su visibilidad depende de la publicación." : "Se quitó la asociación de la foto. El archivo se conserva.";
  return "Cambios guardados. La publicación depende del estado y las verificaciones del registro.";
}
