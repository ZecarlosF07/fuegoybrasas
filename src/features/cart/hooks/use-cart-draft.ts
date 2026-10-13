"use client";

import { useEffect, useRef, useState } from "react";

import { CART_KEY } from "../constants";
import { emptyDraft, reduceDraft } from "../services/draft";
import { readDraft, writeDraft } from "../services/storage";
import type { CartAction } from "../types/cart";
import type { OperationError } from "@/contracts/types/result";

export function useCartDraft() {
  const [draft, setDraft] = useState(emptyDraft);
  const current = useRef(draft);
  const writer = useRef("");
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [expired, setExpired] = useState(false);
  const [external, setExternal] = useState(false);
  const [error, setError] = useState<OperationError | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      writer.current = crypto.randomUUID();
      const recovered = readDraft();
      current.current = recovered.draft;
      setDraft(recovered.draft); setWarning(recovered.warning); setBlocked(recovered.blocked); setExpired(recovered.expired); setReady(true);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) { setExternal(true); setWarning("Otra pestaña modificó el pedido. Decide si quieres cargar esa versión antes de seguir editando."); }
    };
    window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("storage", onStorage); };
  }, []);
  function dispatch(action: CartAction) {
    if (!ready || blocked || expired || external) { setError({ code: "VALIDATION_ERROR", message: "Resuelve primero la recuperación del borrador." }); return false; }
    try {
      const next = reduceDraft(current.current, action);
      current.current = next; setDraft(next); setError(null);
      const notice = writeDraft(next, writer.current);
      if (notice) setWarning(notice);
      return true;
    } catch (cause) { setError({ code: "VALIDATION_ERROR", message: cause instanceof Error ? cause.message : "No pudimos modificar el pedido." }); return false; }
  }
  function resolveRecovery(reset: boolean) {
    if (blocked && !reset) return;
    const next = reset ? emptyDraft() : { ...current.current, updatedAt: new Date().toISOString(), revision: current.current.revision + 1 };
    current.current = next; setDraft(next); setBlocked(false); setExpired(false); setExternal(false); setError(null);
    setWarning(writeDraft(next, writer.current));
  }
  function loadExternal() {
    const recovered = readDraft(true);
    const next = { ...recovered.draft, revision: current.current.revision + 1 };
    current.current = next; setDraft(next); setWarning(recovered.warning); setBlocked(recovered.blocked); setExpired(recovered.expired); setExternal(false); setError(null);
  }
  return { draft, current, ready, warning, blocked, expired, external, dispatch, resolveRecovery, loadExternal, error, setError };
}
