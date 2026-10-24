"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import type { StaffNavigationProps } from "../types/presentation";
import { Button } from "@/components/ui/button";

const STAFF_LINKS = [{ href: "/personal", label: "Inicio del personal" }];
const MANAGER_LINKS = [
  { href: "/administracion", label: "Resumen de fidelización" },
  { href: "/administracion/incidencias", label: "Incidencias" },
  { href: "/administracion/personal", label: "Administrar personal" },
  { href: "/administracion/configuracion", label: "Configuración" },
  { href: "/administracion/carta", label: "Administrar carta" },
];

export function StaffNavigation({ manager }: StaffNavigationProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = manager ? [...STAFF_LINKS, ...MANAGER_LINKS] : STAFF_LINKS;
  return <div className="space-y-3">
    <Button ref={toggle} variant="secondary" className="w-full justify-between lg:hidden" aria-expanded={expanded} aria-controls="staff-navigation" onClick={() => setExpanded(!expanded)}>{expanded ? "Cerrar menú del panel" : "Abrir menú del panel"}<span aria-hidden="true">{expanded ? "−" : "+"}</span></Button>
    <nav id="staff-navigation" aria-label="Navegación del personal" onKeyDown={(event) => { if (event.key === "Escape") { setExpanded(false); toggle.current?.focus(); } }} className={(expanded ? "flex " : "hidden ") + "flex-col gap-2 rounded-card border border-brand-border bg-brand-subtle p-2 lg:flex"}>
    {links.map((link) => {
      const current = pathname === link.href || (link.href === "/personal" && pathname.startsWith("/personal/clientes/")) || (link.href === "/administracion" && pathname.startsWith("/administracion/clientes/"));
      return <Link key={link.href} href={link.href} onClick={() => setExpanded(false)} aria-current={current ? "page" : undefined} className={"inline-flex min-h-12 items-center rounded-field px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action " + (current ? "bg-brand-action text-brand-surface underline underline-offset-4" : "text-brand-ink hover:bg-brand-surface")}>{link.label}</Link>;
    })}
    </nav>
  </div>;
}
