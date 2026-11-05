"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { DashboardMetrics } from "./dashboard-metrics";
import { getCustomersAction, getDashboardAction } from "../server/actions";
import { displayDate } from "../services/dates";
import type { Customers, Dashboard, DashboardProps } from "../types/management";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function LoyaltyDashboard({ initial, customers: initialCustomers }: DashboardProps) {
  const [dashboard, setDashboard] = useState(initial);
  const [customers, setCustomers] = useState(initialCustomers);
  const [filter, setFilter] = useState("all");
  const statsWork = useServerWork<Dashboard>();
  const customersWork = useServerWork<Customers>();
  async function consult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const result = await statsWork.execute(() => getDashboardAction({ from: values.get("from"), until: values.get("until") }));
    if (result?.ok) setDashboard(result.data);
  }
  async function consultCustomers(nextFilter: string, cursor: string | null = null) {
    const result = await customersWork.execute(() => getCustomersAction({ filter: nextFilter, cursor }));
    if (!result?.ok) return;
    setCustomers(result.data); setFilter(nextFilter);
  }
  const currentMetrics = [
    { label: "Clientes registrados", value: dashboard.registeredCustomers },
    { label: "A 1 o 2 visitas del premio", value: dashboard.nearReward },
    { label: "Premios pendientes de canje", value: dashboard.availableRewards },
    { label: "Incidencias abiertas", value: dashboard.openIncidents },
  ];
  const periodMetrics = [
    { label: "Visitas acreditadas", value: dashboard.creditedVisits },
    { label: "Sellos revertidos", value: dashboard.reversedStamps },
    { label: "Premios generados", value: dashboard.issuedRewards },
    { label: "Canjes registrados", value: dashboard.registeredRedemptions },
    { label: "Premios restituidos", value: dashboard.reinstatedRewards },
  ];
  return <div className="space-y-8">
    <div><h1 className="font-brand text-3xl font-bold">Resumen de fidelización</h1><p className="mt-3 text-brand-muted">Consulta el estado de las tarjetas y los movimientos que registró el personal.</p></div>
    <section aria-labelledby="current-loyalty" className="space-y-4">
      <h2 id="current-loyalty" className="text-xl font-bold">Estado actual</h2>
      <DashboardMetrics metrics={currentMetrics} />
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <a href="#clientes-y-tarjetas" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Buscar en clientes y tarjetas</a>
        <Link href="/administracion/incidencias" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Revisar incidencias</Link>
      </div>
    </section>
    <section aria-labelledby="loyalty-period" className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
      <h2 id="loyalty-period" className="text-xl font-bold">Actividad por periodo</h2>
      <form method="post" noValidate onSubmit={consult} className="space-y-4">
      <FormFeedback error={statsWork.error} />
      <div className="grid gap-4 md:grid-cols-2"><TextField id="from" name="from" type="date" label="Desde" defaultValue={initial.from} disabled={statsWork.pending} error={statsWork.error?.fieldErrors?.from?.[0]} /><TextField id="until" name="until" type="date" label="Hasta (inclusive)" defaultValue={initial.until} disabled={statsWork.pending} error={statsWork.error?.fieldErrors?.until?.[0]} /></div>
      <SubmitButton label="Consultar actividad" pendingLabel="Consultando actividad…" pending={statsWork.pending} />
      </form>
      <p role="status" className="text-sm text-brand-muted">Periodo mostrado: {dashboard.from} al {dashboard.until}, hora de Perú.</p>
      <DashboardMetrics metrics={periodMetrics} />
    </section>
    <section className="space-y-4" aria-labelledby="clientes-y-tarjetas">
      <h2 id="clientes-y-tarjetas" tabIndex={-1} className="scroll-mt-6 text-2xl font-bold">Clientes y tarjetas</h2>
      <form method="post" onSubmit={(event) => { event.preventDefault(); void consultCustomers(String(new FormData(event.currentTarget).get("filter"))); }} className="flex flex-wrap items-end gap-4">
        <SelectField id="filter" name="filter" label="Mostrar clientes" defaultValue="all" disabled={customersWork.pending}><option value="all">Todos los clientes activos</option><option value="near_reward">Con 8 o 9 sellos</option><option value="available_reward">Con premios pendientes</option></SelectField>
        <SubmitButton label="Consultar clientes" pendingLabel="Consultando clientes…" pending={customersWork.pending} />
      </form>
      <FormFeedback error={customersWork.error} />
      <p role="status" className="text-sm text-brand-muted">{customers.customers.length === 0 ? "No hay clientes para este filtro." : `En esta página: ${customers.customers.length} ${customers.customers.length === 1 ? "cliente" : "clientes"}.`}</p>
      <ul className="grid gap-4 lg:grid-cols-2">{customers.customers.map((customer) => <li key={customer.id} className="space-y-2 rounded-card border border-brand-border bg-brand-surface p-4">
        <h3 className="text-xl font-semibold">{customer.displayName ?? "Nombre pendiente"}</h3><p>{customer.phone ?? "Contacto pendiente"}</p>
        <p>{customer.progress} de 10 sellos · Premios pendientes: {customer.availableRewards}</p><p className="text-sm text-brand-muted">Última visita: {displayDate(customer.lastVisit)}</p>
        {customer.cardStatus === "suspended" && <p>Tarjeta suspendida</p>}
        <Link href={"/administracion/clientes/" + customer.id} className="flex min-h-12 items-center text-brand-action underline">Revisar tarjeta e historial de {customer.displayName ?? "este cliente"}</Link>
      </li>)}</ul>
      {customers.nextCursor && <Button variant="secondary" disabled={customersWork.pending} aria-busy={customersWork.pending} onClick={() => consultCustomers(filter, customers.nextCursor)}>{customersWork.pending ? "Consultando clientes…" : "Ver siguientes clientes"}</Button>}
    </section>
  </div>;
}
