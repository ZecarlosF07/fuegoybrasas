import Link from "next/link";
import { redirect } from "next/navigation";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { getMyCard } from "@/features/loyalty/server/read";
import type { CustomerLayoutProps } from "@/features/loyalty/types/loyalty";

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  const result = await getMyCard();
  if (result.ok) return children;
  if (["AUTH_REQUIRED", "NOT_FOUND", "CUSTOMER_RECOVERY_REVIEW"].includes(result.error.code)) redirect("/mi-tarjeta/acceso");
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-2xl space-y-6 px-4 py-8 focus:outline-none"><h1 className="font-brand text-3xl font-bold">No pudimos consultar tu tarjeta</h1><p role="alert">{result.error.message}</p><Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/">Continuar con la carta</Link></main></CatalogShell>;
}
