import Link from "next/link";

import { SignOut } from "@/features/identity/components/sign-out";
import type { PrivateShellProps } from "@/features/staff/types/presentation";

export function PrivateShell({ access, children }: PrivateShellProps) {
  return <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 py-6 md:px-6 lg:px-8">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-6">
      <div><Link href="/personal" className="font-brand text-2xl font-bold text-brand-action">Fuego y Brasas</Link>
        <p className="mt-2 text-sm text-brand-muted">{access.role === "manager" ? "Responsable" : "Atención"}</p></div>
      <SignOut />
    </header>
    <nav aria-label="Navegación del personal" className="flex flex-wrap gap-4 border-b border-brand-border py-4">
      <Link href="/personal" className="flex min-h-12 items-center text-brand-action underline">Inicio del personal</Link>
      {access.role === "manager" && <Link href="/administracion" className="flex min-h-12 items-center text-brand-action underline">Resumen de fidelización</Link>}
      {access.role === "manager" && <Link href="/administracion/incidencias" className="flex min-h-12 items-center text-brand-action underline">Incidencias</Link>}
      {access.role === "manager" && <Link href="/administracion/personal" className="flex min-h-12 items-center text-brand-action underline">Administrar personal</Link>}
      {access.role === "manager" && <Link href="/administracion/configuracion" className="flex min-h-12 items-center text-brand-action underline">Configuración</Link>}
      {access.role === "manager" && <Link href="/administracion/carta" className="flex min-h-12 items-center text-brand-action underline">Administrar carta</Link>}
    </nav>
    <main id="contenido" className="py-8">{children}</main>
  </div>;
}
