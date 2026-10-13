"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

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
  const metrics = [
    ["Clientes registrados", dashboard.registeredCustomers], ["A 1 o 2 visitas del premio", dashboard.nearReward],
    ["Premios pendientes de canje", dashboard.availableRewards], ["Incidencias abiertas", dashboard.openIncidents],
    ["Visitas acreditadas en el periodo", dashboard.creditedVisits], ["Sellos revertidos en el periodo", dashboard.reversedStamps],
    ["Premios generados en el periodo", dashboard.issuedRewards], ["Canjes registrados en el periodo", dashboard.registeredRedemptions],
    ["Premios restituidos en el periodo", dashboard.reinstatedRewards],
  ];
  return <div className="space-y-8">
    <div><h1 className="font-brand text-3xl font-bold">Resumen de fidelización</h1><p className="mt-3 text-brand-muted">Supervisa las tarjetas y los movimientos registrados. Estos indicadores no representan todas las ventas ni confirman entregas físicas.</p></div>
    <form method="post" noValidate onSubmit={consult} className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
      <h2 className="text-xl font-bold">Actividad por periodo</h2>
      <FormFeedback error={statsWork.error} />
      <div className="grid gap-4 md:grid-cols-2"><TextField id="from" name="from" type="date" label="Desde" defaultValue={initial.from} disabled={statsWork.pending} error={statsWork.error?.fieldErrors?.from?.[0]} /><TextField id="until" name="until" type="date" label="Hasta (inclusive)" defaultValue={initial.until} disabled={statsWork.pending} error={statsWork.error?.fieldErrors?.until?.[0]} /></div>
      <SubmitButton label="Consultar actividad" pendingLabel="Consultando actividad…" pending={statsWork.pending} />
      <p className="text-sm text-brand-muted">Periodo mostrado: {dashboard.from} al {dashboard.until}, hora de Perú. Clientes, progreso, premios pendientes e incidencias muestran su estado actual.</p>
    </form>
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-card border border-brand-border bg-brand-surface p-4"><dt className="text-brand-muted">{label}</dt><dd className="mt-2 text-3xl font-bold tabular-nums">{value}</dd></div>)}</dl>
    <section className="space-y-4" aria-labelledby="customers-title">
      <h2 id="customers-title" className="text-2xl font-bold">Clientes y tarjetas</h2>
      <form method="post" onSubmit={(event) => { event.preventDefault(); void consultCustomers(String(new FormData(event.currentTarget).get("filter"))); }} className="flex flex-wrap items-end gap-4">
        <SelectField id="filter" name="filter" label="Mostrar clientes" defaultValue="all" disabled={customersWork.pending}><option value="all">Todos los clientes activos</option><option value="near_reward">Con 8 o 9 sellos</option><option value="available_reward">Con premios pendientes</option></SelectField>
        <SubmitButton label="Consultar clientes" pendingLabel="Consultando clientes…" pending={customersWork.pending} />
      </form>
      <FormFeedback error={customersWork.error} />
      {customers.customers.length === 0 && <p role="status">No hay clientes para este filtro.</p>}
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
