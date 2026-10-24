import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import type { ShellProps } from "@/features/staff/types/presentation";

export function AccessShell({ children }: ShellProps) {
  return <div className="flex min-h-dvh flex-col">
    <header className="bg-brand-action text-brand-surface"><div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
      <BrandMark subtitle="Área del personal" />
      <Link href="/" className="flex min-h-12 items-center rounded-field px-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface">Volver al inicio</Link>
    </div>
    </header>
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-xl px-4 py-8 focus:outline-none md:py-12">
      <p className="mb-4 text-sm font-semibold text-brand-muted">Área del personal</p>
      <div className="rounded-card border border-brand-border bg-brand-surface p-6 md:p-8">{children}</div>
    </main>
    <footer className="mt-auto border-t border-brand-border bg-brand-subtle px-4 py-6 text-center text-sm text-brand-muted">Sabor que une, momentos que quedan.</footer>
  </div>;
}
