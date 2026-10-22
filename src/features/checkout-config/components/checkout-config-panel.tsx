"use client";

import { useState } from "react";

import { CheckoutConfigEditor } from "./checkout-config-editor";
import type { CheckoutPanelProps, CheckoutSelection } from "../types/config";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { getAdminConfigAction } from "@/features/business-config/server/actions";
import type { BusinessConfig } from "@/features/business-config/types/config";

export function CheckoutConfigPanel({ initial, actorUserId }: CheckoutPanelProps) {
  const [config, setConfig] = useState(initial);
  const [selection, setSelection] = useState<CheckoutSelection | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const loading = useServerWork<BusinessConfig>();
  async function reload() {
    const result = await loading.execute(getAdminConfigAction);
    if (!result?.ok) throw new Error("No pudimos cargar la configuración actual.");
    setConfig(result.data); setSelection(null);
  }
  async function refresh() { try { await reload(); } catch { loading.setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos actualizar la lista. Conserva la operación y vuelve a consultar." }); } }
  const disabled = busy || loading.pending;
  return <section aria-label="Zonas del pedido" className="mt-10 max-w-3xl space-y-6 border-t border-brand-border pt-8">
    <h2 className="font-brand text-2xl font-bold">Condiciones del pedido</h2><p>Versión {config.revision}. La web prepara el carrito para WhatsApp sin solicitar medio de pago. Puedes definir zonas y cargos conocidos; los datos pendientes se coordinan por el chat.</p>
    <FormFeedback error={loading.error} />
    <CheckboxField id="checkout-deleted" label="Mostrar condiciones retiradas" checked={showDeleted} disabled={disabled} onChange={(event) => setShowDeleted(event.target.checked)} />
    <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={disabled} onClick={() => setSelection({ entityType: "delivery_zone", entityId: crypto.randomUUID(), creating: true, row: {} })}>Crear zona</Button><Button variant="secondary" disabled={disabled} aria-busy={loading.pending} onClick={refresh}>{loading.pending ? "Cargando condiciones…" : "Cargar condiciones actuales"}</Button></div>
    <section><h3 className="mb-3 font-semibold">Zonas</h3>{config.deliveryZones.length === 0 && <p>La cobertura y cargos permanecen pendientes.</p>}<ul className="space-y-2">{config.deliveryZones.filter((row) => showDeleted || !row.deleted_at).map((row) => <li key={row.id}><Button variant="secondary" disabled={disabled} onClick={() => setSelection({ entityType: "delivery_zone", entityId: row.id, row, creating: false })}>{row.name} · {row.deleted_at ? "retirada" : row.enabled && row.verified ? row.coverage === "excluded" ? "no atendida" : "confirmada" : "pendiente"}</Button></li>)}</ul></section>
    {selection && <CheckoutConfigEditor key={`${selection.entityId}-${selection.row.revision ?? 0}`} selection={selection} configRevision={config.revision} actorUserId={actorUserId} onSaved={reload} onBusyChange={setBusy} />}
  </section>;
}
