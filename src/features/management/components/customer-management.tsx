"use client";

import { useState } from "react";

import { ContingencyForm } from "./contingency-form";
import { CorrectionForm } from "./correction-form";
import { CustomerHistory } from "./customer-history";
import { ManagementFeedback } from "./operation-feedback";
import { RecoveryForm } from "./recovery-form";
import { useManagementOperation } from "../hooks/use-management-operation";
import { getHistoryAction } from "../server/actions";
import type { CustomerManagementProps, History } from "../types/management";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { CardSummary } from "@/features/loyalty/components/card-summary";
import { getStaffCustomerAction } from "@/features/loyalty/server/actions";

export function CustomerManagement({ card: initialCard, history: initialHistory, actorUserId }: CustomerManagementProps) {
  const [card, setCard] = useState(initialCard);
  const [history, setHistory] = useState(initialHistory);
  const historyWork = useServerWork<History>();
  async function reload() {
    const current = await getStaffCustomerAction(card.customerId);
    if (!current.ok) throw new Error("No pudimos leer la tarjeta actual.");
    const events = await getHistoryAction({ customerId: card.customerId });
    if (!events.ok) throw new Error("No pudimos leer el historial actual.");
    setCard(current.data); setHistory(events.data);
  }
  const operation = useManagementOperation(actorUserId, reload);
  async function more() {
    if (!history.nextCursor) return;
    const result = await historyWork.execute(() => getHistoryAction({ customerId: card.customerId, cursor: history.nextCursor }));
    if (result?.ok) setHistory({ ...result.data, events: [...history.events, ...result.data.events] });
  }
  return <div className="space-y-6">
    <h1 className="font-brand text-3xl font-bold">Supervisar tarjeta de {card.displayName}</h1>
    <p>Contacto declarado: {card.phone ?? "Pendiente"}. Confirma la identidad antes de intervenir.</p>
    <ManagementFeedback operation={operation} />
    <Button variant="secondary" onClick={operation.refresh} disabled={operation.pending || operation.journal !== null} aria-busy={operation.pending}>{operation.pending && !operation.journal ? "Consultando estado…" : "Consultar estado actual"}</Button>
    <div className="grid gap-6 lg:grid-cols-2"><CardSummary card={card} /><CorrectionForm key={card.profileRevision} card={card} operation={operation} /></div>
    <FormFeedback error={historyWork.error} />
    <CustomerHistory history={history} operation={operation} onMore={more} loading={historyWork.pending} />
    <ContingencyForm card={card} operation={operation} />
    <RecoveryForm card={card} history={history} operation={operation} />
  </div>;
}
