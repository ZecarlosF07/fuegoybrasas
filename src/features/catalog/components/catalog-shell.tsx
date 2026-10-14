import Link from "next/link";

import { CATALOG_FOCUS_CLASSES } from "../constants";
import type { CatalogShellProps } from "../types/catalog";
import { CartDock } from "@/features/cart/components/cart-dock";

export function CatalogShell({ children, showCartDock = true }: CatalogShellProps) {
  return (
    <>
      <header className="border-b border-brand-border bg-brand-bg">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <Link href="/" className={`flex min-h-12 flex-col justify-center ${CATALOG_FOCUS_CLASSES}`}><span className="font-brand text-2xl font-bold">Fuego y Brasas<span aria-hidden="true" className="text-brand-action">.</span></span><span className="text-sm text-brand-muted">Pollería · Parcona, Ica</span></Link>
          <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-1">
            <Link href="/#carta" className={`inline-flex min-h-12 items-center px-3 font-semibold text-brand-action underline underline-offset-4 ${CATALOG_FOCUS_CLASSES}`}>Ver carta</Link>
            <Link href="/mi-tarjeta" className={`inline-flex min-h-12 items-center px-3 text-brand-ink hover:text-brand-action ${CATALOG_FOCUS_CLASSES}`}>Mi tarjeta</Link>
            <Link href="/pedido" className={`inline-flex min-h-12 items-center rounded-button border border-brand-control-border bg-brand-surface px-4 font-semibold text-brand-ink hover:bg-brand-bg ${CATALOG_FOCUS_CLASSES}`}>Mi pedido</Link>
          </nav>
        </div>
      </header>
      {children}
      {showCartDock && <CartDock />}
      <footer className={`${showCartDock ? "mb-[calc(9rem+env(safe-area-inset-bottom))]" : ""} mt-12 border-t border-brand-border bg-brand-ink text-brand-surface`}>
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-6 px-4 py-10 md:px-6 lg:px-8">
          <p><span className="font-brand text-2xl font-semibold">Fuego y Brasas<span aria-hidden="true" className="text-brand-gold">.</span></span><br /><span className="mt-2 inline-block text-sm text-brand-surface/85">Sabor que une, momentos que quedan.<br />Parcona, Ica.</span></p>
          <Link href="/personal/acceso" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface">Acceso del personal</Link>
          <Link href="/privacidad" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface">Uso de tus datos</Link>
        </div>
      </footer>
    </>
  );
}
