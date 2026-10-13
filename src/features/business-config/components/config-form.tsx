"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfigFields } from "@/features/business-config/components/config-fields";
import { ScheduleEditor } from "@/features/business-config/components/schedule-editor";
import { getAdminConfigAction, updateBusinessConfigAction } from "@/features/business-config/server/actions";
import { configFormPatch } from "@/features/business-config/services/form";
import { clearConfigJournal, configFingerprint, readConfigJournal, writeConfigJournal } from "@/features/business-config/services/journal";
import type { BusinessConfig, ConfigFormProps } from "@/features/business-config/types/config";
import type { ConfigJournal, StaffMutation, StaffOperation } from "@/features/business-config/types/journal";
import { configChangeSchema } from "@/features/business-config/validation/schemas";
import { getOperationAction } from "@/features/staff/server/actions";

export function ConfigForm({ initial, actorUserId }: ConfigFormProps) {
  const [config, setConfig] = useState(initial);
  const [periods, setPeriods] = useState(initial.openingPeriods);
  const [journal, setJournal] = useState<ConfigJournal | null>(null);
  const [journalReady, setJournalReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const preparing = useRef(false);
  const [preparingSave, setPreparingSave] = useState(false);
  const saving = useServerWork<StaffMutation>();
  const checking = useServerWork<StaffOperation>();
  const loading = useServerWork<BusinessConfig>();
  const { setError } = saving;
  const pending = preparingSave || saving.pending || checking.pending || loading.pending;
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setJournal(readConfigJournal(actorUserId)); setJournalReady(true); }
      catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos leer el registro de operaciones. Habilita el almacenamiento de esta pestaña antes de guardar." }); }
    });
    return () => { active = false; };
  }, [actorUserId, setError]);
  async function reload() {
    const result = await loading.execute(getAdminConfigAction);
    if (!result?.ok) return false;
    saving.setError(null); checking.setError(null);
    setConfig(result.data); setPeriods(result.data.openingPeriods);
    setMessage("Se cargó la versión actual. Revisa los datos antes de guardar.");
    return true;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || preparing.current || !journalReady) return;
    preparing.current = true;
    const patch = configFormPatch(new FormData(event.currentTarget), periods, config);
    const operationId = journal?.operationId ?? crypto.randomUUID();
    const expectedRevision = journal?.expectedRevision ?? config.revision;
    const parsed = configChangeSchema.safeParse({ patch, expectedRevision, operationId });
    if (!parsed.success) { preparing.current = false; saving.setError({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Revisa los datos." }); return; }
    setPreparingSave(true);
    try {
      const fingerprint = await configFingerprint({ expectedRevision, patch: parsed.data.patch });
      if (journal && journal.fingerprint !== fingerprint) { saving.setError({ code: "IDEMPOTENCY_CONFLICT", message: "Hay una operación pendiente con otros datos. Comprueba su resultado antes de iniciar otra." }); return; }
      const record = journal ?? { actorUserId, operationId, expectedRevision, fingerprint, createdAt: Date.now() };
      writeConfigJournal(record); setJournal(record); setMessage(null);
      const result = await saving.execute(() => updateBusinessConfigAction(parsed.data));
      if (!result) return;
      if (result.ok) { clearConfigJournal(); setJournal(null); setConfig({ ...config, ...parsed.data.patch, revision: result.data.revision }); setMessage("Configuración guardada."); return; }
      if (result.error.code !== "OPERATION_UNCERTAIN") { clearConfigJournal(); setJournal(null); }
    } catch { saving.setError({ code: "OPERATION_UNCERTAIN", message: "No pudimos comprobar el guardado o registrar su resultado. Conserva esta pantalla y consulta la operación." }); }
    finally { preparing.current = false; setPreparingSave(false); }
  }
  async function check() {
    if (!journal) return;
    const result = await checking.execute(() => getOperationAction(journal.operationId));
    if (!result?.ok) return;
    if (result.data.status === "not_found") { setMessage("La operación aún no está registrada. Conservamos su identificador: reintenta con los mismos datos; no inicies otra operación."); return; }
    try {
      clearConfigJournal(); setJournal(null);
      if (await reload()) setMessage("Se comprobó el guardado. Se muestra la versión actual para revisión.");
    }
    catch { checking.setError({ code: "SERVICE_UNAVAILABLE", message: "El resultado está registrado, pero no pudimos limpiar el registro local. Consulta al responsable." }); }
  }
  return <div className="max-w-3xl space-y-6">
    <h1 className="font-brand text-3xl font-bold">Configuración del local</h1>
    <p className="text-brand-muted">Versión {config.revision}. Los cambios se registran con tu cuenta.</p>
    <FormFeedback error={saving.error ?? checking.error ?? loading.error} message={message} />
    {journal && <div className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4">
      <p>Hay un guardado pendiente de comprobación. Referencia <span className="break-all">{journal.operationId}</span>.</p>
      <Button disabled={pending} aria-busy={checking.pending} onClick={check}>{checking.pending ? "Comprobando resultado…" : "Comprobar resultado"}</Button>
    </div>}
    <form method="post" onSubmit={submit} noValidate className="space-y-8 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
      <ConfigFields key={config.revision} config={config} disabled={pending} errors={saving.error?.fieldErrors} />
      <ScheduleEditor periods={periods} disabled={pending} onChange={setPeriods} />
      <SubmitButton pending={saving.pending || preparingSave} label={journal ? "Reintentar el mismo guardado" : "Guardar configuración"} pendingLabel="Guardando configuración…" disabled={pending || !journalReady} />
    </form>
    <Button variant="secondary" onClick={reload} disabled={pending || journal !== null} aria-busy={loading.pending}>{loading.pending ? "Cargando versión actual…" : "Descartar cambios y cargar versión actual"}</Button>
  </div>;
}
