import Link from "next/link";

import { CustomerLookup } from "@/features/loyalty/components/customer-lookup";
import { requireStaffPage } from "@/features/staff/server/access";

export default async function StaffHomePage() {
  const access = await requireStaffPage();
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  return <div className="max-w-2xl space-y-6">
    <h1 className="font-brand text-3xl font-bold">Inicio del personal</h1>
    <p>Tu acceso está verificado. Identifica la tarjeta antes de registrar una visita o un canje.</p>
    <CustomerLookup />
    {access.data.role === "manager" && <div className="rounded-card border border-brand-border bg-brand-surface p-6">
      <h2 className="text-xl font-semibold">Datos del local</h2><p className="my-4 text-brand-muted">Revisa el nombre, contacto y datos operativos antes de habilitar la carta y los pedidos.</p>
      <Link href="/administracion/configuracion" className="flex min-h-12 items-center text-brand-action underline">Revisar configuración</Link>
    </div>}
  </div>;
}
