"use client";

import { useState } from "react";

import { CardSummary } from "./card-summary";
import { CreditForm } from "./credit-form";
import { IncidentForm } from "./incident-form";
import { RedeemForm } from "./redeem-form";
import { useLoyaltyOperation } from "../hooks/use-loyalty-operation";
import { getStaffCustomerAction } from "../server/actions";
import type { StaffCardProps } from "../types/loyalty";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";

export function StaffCardView({ initial, actorUserId }: StaffCardProps) {
  const [card, setCard] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  async function reload() {
    setRefreshing(true);
    try {
      const result = await getStaffCustomerAction(card.customerId);
      if (!result.ok) throw new Error("No se pudo actualizar la ficha.");
      setCard(result.data);
    } finally { setRefreshing(false); }
  }
  const operation = useLoyaltyOperation(actorUserId, reload);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-brand text-3xl font-bold">Atender tarjeta</h1><Button variant="secondary" disabled={operation.pending || refreshing || operation.journal !== null} aria-busy={operation.pending || refreshing} onClick={operation.refresh}>{refreshing ? "Consultando tarjeta…" : "Consultar tarjeta actual"}</Button></div>
    <p>Confirma identidad: <strong>{card.displayName}</strong> · {card.phone ?? "teléfono pendiente de revisión"}.</p>
    <FormFeedback error={operation.error} message={operation.message} />
    {operation.journal && <div className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4">
      <p>Hay una operación pendiente. No registres otra acreditación o canje.</p><p className="break-all text-sm">Referencia: {operation.journal.operationId}</p>
      <Button disabled={operation.pending || refreshing} aria-busy={operation.pending} onClick={operation.check}>{operation.pending ? "Comprobando resultado…" : "Comprobar resultado"}</Button>
    </div>}
    <div className="grid gap-6 lg:grid-cols-2"><CardSummary card={card} /><div className="space-y-6">
      <CreditForm key={"credit:" + card.cardRevision} card={card} operation={operation} /><RedeemForm key={"redeem:" + card.cardRevision} card={card} operation={operation} />
    </div></div>
    <IncidentForm key={"incident:" + card.openIncidents.length} card={card} operation={operation} />
    {card.openIncidents.length > 0 && <p role="status">Incidencias abiertas: {card.openIncidents.length}. Su registro no corrige el saldo automáticamente.</p>}
  </div>;
}
