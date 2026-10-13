"use client";

import { useEffect, useRef, useState } from "react";

import { clearLoyaltyJournal, journalTimestamp, loyaltyFingerprint, readLoyaltyJournal, writeLoyaltyJournal } from "../services/journal";
import { dispatchLoyaltyOperation } from "../services/operations";
import type { LoyaltyInput, LoyaltyJournal, LoyaltyKind } from "../types/loyalty";
import type { OperationError } from "@/contracts/types/result";
import { getOperationAction } from "@/features/staff/server/actions";
import type { StaffConflict } from "@/features/staff/types/staff";

export function useLoyaltyOperation(actorUserId: string, reload: () => Promise<void>) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [journal, setJournal] = useState<LoyaltyJournal | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<OperationError<StaffConflict> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setJournal(readLoyaltyJournal(actorUserId)); setReady(true); }
      catch (cause) { setError({ code: "SERVICE_UNAVAILABLE", message: cause instanceof Error ? cause.message : "No pudimos leer la operación pendiente. Habilita el almacenamiento antes de operar." }); }
    });
    return () => { active = false; };
  }, [actorUserId]);
  async function run(kind: LoyaltyKind, candidate: LoyaltyInput) {
    if (running.current || !ready || (journal && !checked)) return;
    running.current = true; setPending(true); setError(null); setMessage(null);
    let confirmed = false;
    try {
      const input = { ...candidate, operationId: journal?.operationId ?? candidate.operationId };
      const fingerprint = await loyaltyFingerprint(kind, input);
      if (journal && (journal.kind !== kind || journal.fingerprint !== fingerprint)) {
        setError({ code: "IDEMPOTENCY_CONFLICT", message: "Reconstruye la misma operación con los mismos datos. No uses otra referencia." }); return;
      }
      const record: LoyaltyJournal = journal ?? {
        actorUserId, operationId: input.operationId, customerId: "customerId" in input ? input.customerId : null,
        programId: "programId" in input ? input.programId : null, rewardId: "rewardId" in input ? input.rewardId ?? null : null,
        kind, fingerprint, createdAt: journalTimestamp(),
      };
      // Si no puede persistirse, no se envía ninguna escritura.
      writeLoyaltyJournal(record); setJournal(record); setChecked(false);
      const result = await dispatchLoyaltyOperation(kind, input);
      if (!result.ok) { handleFailure(result.error); return; }
      confirmed = true; clearLoyaltyJournal(); setJournal(null);
      setMessage(kind === "credit" ? "Visita acreditada. Se muestra el progreso confirmado." : kind === "redeem" ? "Canje registrado. Entrega el premio; si no es posible, registra una incidencia." : kind === "incident" ? "Incidencia registrada para revisión. El saldo y el canje se conservan." : "Configuración del programa guardada.");
      await reload();
    } catch {
      if (confirmed) setReady(false);
      setError({ code: confirmed ? "SERVICE_UNAVAILABLE" : "OPERATION_UNCERTAIN", message: confirmed ? "El resultado está confirmado, pero no pudimos actualizar la ficha. Consulta su versión actual." : "No pudimos comprobar el resultado o guardar su referencia. Consulta antes de repetir." });
    } finally { running.current = false; setPending(false); }
  }
  function handleFailure(problem: OperationError<StaffConflict>) {
    if (!["OPERATION_UNCERTAIN", "IDEMPOTENCY_CONFLICT"].includes(problem.code)) { clearLoyaltyJournal(); setJournal(null); }
    setError(problem);
  }
  async function check() {
    if (running.current || !journal) return;
    running.current = true; setPending(true); setError(null); setMessage(null);
    try {
      const result = await getOperationAction(journal.operationId);
      if (!result.ok) { setError(result.error); return; }
      if (result.data.status === "not_found") {
        setChecked(true); setMessage("Aún no hay recibo. Solo puedes reintentar la misma operación, con los mismos datos e identificador."); return;
      }
      clearLoyaltyJournal(); setJournal(null); setChecked(false);
      await reload(); setMessage("Resultado registrado. Se consultó la ficha actual; no se repitió la operación.");
    } catch { setReady(false); setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos consultar o limpiar la referencia. Consérvala y solicita revisión." }); }
    finally { running.current = false; setPending(false); }
  }
  async function refresh() {
    if (running.current || journal) return;
    running.current = true; setPending(true);
    try { await reload(); readLoyaltyJournal(actorUserId); setReady(true); setError(null); }
    catch { setReady(false); setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos actualizar la ficha. Consulta nuevamente antes de operar." }); }
    finally { running.current = false; setPending(false); }
  }
  return { pending, ready, journal, checked, error, message, setError, run, check, refresh };
}
