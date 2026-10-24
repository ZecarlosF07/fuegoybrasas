"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINK_CLASSES = "inline-flex min-h-12 items-center justify-center rounded-field px-3 text-sm font-semibold text-brand-surface underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-surface sm:text-base";

export function CatalogNavigation() {
  const pathname = usePathname();
  const inCard = pathname.startsWith("/mi-tarjeta");
  const inOrder = pathname.startsWith("/pedido");
  return <nav aria-label="Navegación principal" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-4">
    <Link href="/#carta" aria-current={!inCard && !inOrder && (pathname === "/" || pathname.startsWith("/productos/")) ? "page" : undefined} className={LINK_CLASSES + " aria-[current=page]:decoration-brand-primary aria-[current=page]:decoration-2 aria-[current=page]:underline"}>Ver carta</Link>
    <Link href="/mi-tarjeta" aria-current={inCard ? "page" : undefined} className={LINK_CLASSES + " aria-[current=page]:decoration-brand-primary aria-[current=page]:decoration-2 aria-[current=page]:underline"}>Mi tarjeta</Link>
    <Link href="/pedido" aria-current={inOrder ? "page" : undefined} className={LINK_CLASSES + " border border-brand-surface hover:bg-brand-action-hover aria-[current=page]:underline"}>Mi pedido</Link>
  </nav>;
}
