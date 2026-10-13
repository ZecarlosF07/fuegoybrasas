import Link from "next/link";

import type { ShellProps } from "@/features/staff/types/presentation";

export function AccessShell({ children }: ShellProps) {
  return <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 py-8 md:px-6 lg:px-8">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-6">
      <Link href="/" className="font-brand text-2xl font-bold text-brand-action focus-visible:outline-2 focus-visible:outline-offset-2">Fuego y Brasas</Link>
      <Link href="/" className="flex min-h-12 items-center text-brand-muted underline">Volver al inicio</Link>
    </header>
    <main id="contenido" className="mx-auto w-full max-w-xl py-8 md:py-12">
      <p className="mb-4 text-sm font-semibold text-brand-muted">Área del personal</p>
      <div className="rounded-card border border-brand-border bg-brand-surface p-6 md:p-8">{children}</div>
    </main>
    <footer className="mt-auto pt-8 text-sm text-brand-muted">Sabor que une, momentos que quedan.</footer>
  </div>;
}
