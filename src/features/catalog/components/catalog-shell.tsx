import Link from "next/link";

import { CatalogNavigation } from "./catalog-navigation";
import type { CatalogShellProps } from "../types/catalog";
import { BrandMark } from "@/components/brand/brand-mark";
import { CartDock } from "@/features/cart/components/cart-dock";

export function CatalogShell({ children, showCartDock = true }: CatalogShellProps) {
  return (
    <>
      <header className="bg-brand-action text-brand-surface">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <BrandMark />
          <CatalogNavigation />
        </div>
      </header>
      {children}
      {showCartDock && <CartDock />}
      <footer className={`${showCartDock ? "mb-[calc(9rem+env(safe-area-inset-bottom))]" : ""} mt-12 border-t border-brand-border bg-brand-subtle text-brand-ink`}>
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-6 px-4 py-10 md:px-6 lg:px-8">
          <p><span className="font-brand text-2xl font-semibold">Fuego y Brasas</span><br /><span className="mt-2 inline-block text-sm text-brand-muted">Sabor que une, momentos que quedan.<br />Parcona, Ica.</span></p>
          <Link href="/personal/acceso" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">Acceso del personal</Link>
          <Link href="/privacidad" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">Uso de tus datos</Link>
          <Link href="/condiciones-tarjeta" className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">Condiciones de la tarjeta</Link>
        </div>
      </footer>
    </>
  );
}
