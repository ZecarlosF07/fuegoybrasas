import Link from "next/link";


import { CATALOG_FOCUS_CLASSES } from "../constants";
import type { CatalogShellProps } from "../types/catalog";
import { CartDock } from "@/features/cart/components/cart-dock";

export function CatalogShell({ children, showCartDock = true }: CatalogShellProps) {
  return (
    <>
      <header className="border-b border-brand-border bg-brand-bg">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <Link href="/" className={`flex min-h-12 items-center font-brand text-2xl font-bold ${CATALOG_FOCUS_CLASSES}`}>Fuego y Brasas</Link>
          <nav aria-label="Navegación principal">
            <Link href="/#carta" className={`inline-flex min-h-12 items-center px-4 font-semibold text-brand-action underline underline-offset-4 ${CATALOG_FOCUS_CLASSES}`}>Ver carta</Link>
            <Link href="/mi-tarjeta" className={`inline-flex min-h-12 items-center px-4 text-brand-action underline underline-offset-4 ${CATALOG_FOCUS_CLASSES}`}>Mi tarjeta</Link>
          </nav>
        </div>
      </header>
      {children}
      {showCartDock && <CartDock />}
      <footer className={`${showCartDock ? "mb-[calc(9rem+env(safe-area-inset-bottom))]" : ""} mt-12 border-t border-brand-border bg-brand-ink text-brand-surface`}>
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-6 lg:px-8">
          <p><span className="font-brand text-xl font-semibold">Fuego y Brasas</span><br /><span className="text-sm">Pollería · Parcona, Ica</span></p>
          <Link href="/personal/acceso" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface">Acceso del personal</Link>
          <Link href="/privacidad" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface">Uso de tus datos</Link>
        </div>
      </footer>
    </>
  );
}
