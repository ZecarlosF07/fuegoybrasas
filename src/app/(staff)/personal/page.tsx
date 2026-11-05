import Link from "next/link";

import { CustomerLookup } from "@/features/loyalty/components/customer-lookup";
import { requireStaffPage } from "@/features/staff/server/access";

export const metadata = { title: "Inicio del personal | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function StaffHomePage() {
  const access = await requireStaffPage();
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  return <div className="max-w-2xl space-y-6">
    <h1 className="font-brand text-3xl font-bold">Inicio del personal</h1>
    <p className="text-brand-muted">Busca una tarjeta para registrar un sello o canjear un premio.</p>
    <CustomerLookup />
    {access.data.role === "manager" && <div className="rounded-card border border-brand-border bg-brand-surface p-6">
      <h2 className="text-xl font-semibold">Administrar el negocio</h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/administracion" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Ver tarjetas e indicadores</Link>
        <Link href="/administracion/carta" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Administrar la carta</Link>
        <Link href="/administracion/configuracion" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">Revisar configuración</Link>
      </div>
    </div>}
  </div>;
}
