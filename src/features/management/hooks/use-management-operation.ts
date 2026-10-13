"use client";

import { useEffect, useRef, useState } from "react";

import { managementError } from "../services/forms";
import { clearManagementJournal, managementFingerprint, managementTimestamp, readManagementJournal, writeManagementJournal } from "../services/journal";
import { managementNotice } from "../services/notices";
import { dispatchManagementOperation } from "../services/operations";
import type { ManagementInput, ManagementJournal, ManagementKind } from "../types/management";
import { recoveredLinkSchema } from "../validation/dto";
import type { OperationError } from "@/contracts/types/result";
import type { PrivateCardLink } from "@/features/loyalty/types/loyalty";
import { getOperationAction } from "@/features/staff/server/actions";
import type { StaffConflict } from "@/features/staff/types/staff";

export function useManagementOperation(actorUserId: string, reload: () => Promise<void>) {
  const running = useRef(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [journal, setJournal] = useState<ManagementJournal | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<OperationError<StaffConflict> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recoveryLink, setRecoveryLink] = useState<PrivateCardLink | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setJournal(readManagementJournal(actorUserId)); setReady(true); }
      catch (cause) { setError({ code: "SERVICE_UNAVAILABLE", message: cause instanceof Error ? cause.message : "No pudimos leer el registro local." }); }
    });
    return () => { active = false; };
  }, [actorUserId]);
  async function run(kind: ManagementKind, candidate: ManagementInput) {
    if (running.current || !ready || (journal && !checked)) return;
    running.current = true; setPending(true); setError(null); setMessage(null);
    let confirmed = false;
    try {
      const input = { ...candidate, operationId: journal?.operationId ?? candidate.operationId };
      const fingerprint = await managementFingerprint(kind, input);
      if (journal && (journal.kind !== kind || journal.fingerprint !== fingerprint)) {
        setError({ code: "IDEMPOTENCY_CONFLICT", message: "Reconstruye la misma intervención con los mismos datos y referencia." }); return;
      }
      const record: ManagementJournal = journal ?? { feature: "h7-management", actorUserId, kind, fingerprint, operationId: input.operationId, createdAt: managementTimestamp() };
      writeManagementJournal(record); setJournal(record); setChecked(false);
      const result = await dispatchManagementOperation(kind, input);
      if (!result.ok) { handleFailure(managementError(result.error, kind)); return; }
      if ("privateLink" in result.data) setRecoveryLink(recoveredLinkSchema.parse(result.data.privateLink));
      confirmed = true; clearManagementJournal(); setJournal(null);
      setMessage(managementNotice(kind, result.data.outcome));
      await reload();
    } catch {
      if (confirmed) setReady(false);
      setError({ code: confirmed ? "SERVICE_UNAVAILABLE" : "OPERATION_UNCERTAIN", message: confirmed ? "La intervención está registrada, pero falta actualizar esta pantalla. Consulta el estado actual." : "El resultado es incierto. Comprueba esta operación antes de repetir." });
    } finally { running.current = false; setPending(false); }
  }
  function handleFailure(problem: OperationError<StaffConflict>) {
    if (!["OPERATION_UNCERTAIN", "IDEMPOTENCY_CONFLICT"].includes(problem.code)) { clearManagementJournal(); setJournal(null); }
    setError(problem);
  }
  async function check() {
    if (running.current || !journal) return;
    running.current = true; setPending(true); setError(null);
    try {
      const result = await getOperationAction(journal.operationId);
      if (!result.ok) { setError(result.error); return; }
      if (result.data.status === "not_found") { setChecked(true); setMessage("No hay recibo. Reintenta únicamente la misma intervención con los mismos datos."); return; }
      if (journal.kind === "recover") { setChecked(true); setMessage("La rotación está registrada. Reintenta esta misma recuperación para mostrar el enlace, conservando sus datos originales."); return; }
      if (result.data.currentState.entity === "staff_invitation" && !["sent", "ready"].includes(result.data.currentState.state)) {
        setChecked(true); setMessage("La invitación sigue incompleta y sin acceso activo. Reintenta la misma invitación para conciliarla, sin cambiar sus datos."); return;
      }
      clearManagementJournal(); setJournal(null); setChecked(false);
      setMessage(result.data.result.outcome === "review_required" ? "La operación registró una revisión requerida; el saldo no se corrigió." : "Resultado confirmado sin repetir la intervención.");
      await reload();
    } catch { setReady(false); setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos consultar el resultado. Conserva su referencia." }); }
    finally { running.current = false; setPending(false); }
  }
  async function refresh() {
    if (running.current || journal) return;
    running.current = true; setPending(true);
    try { await reload(); readManagementJournal(actorUserId); setReady(true); setError(null); }
    catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos actualizar la pantalla. Intenta consultar otra vez." }); }
    finally { running.current = false; setPending(false); }
  }
  return { ready, pending, checked, journal, error, message, recoveryLink, setError, run, check, refresh };
}
