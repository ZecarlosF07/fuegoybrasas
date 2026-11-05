import Link from "next/link";
import { redirect } from "next/navigation";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { SignOut } from "@/features/identity/components/sign-out";
import { SaveCardLink } from "@/features/loyalty/components/card-link";
import { CardSummary } from "@/features/loyalty/components/card-summary";
import { PreferencesForm } from "@/features/loyalty/components/preferences-form";
import { getMyCard } from "@/features/loyalty/server/read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi tarjeta | Fuego y Brasas", robots: { index: false, follow: false } };
export default async function CustomerCardPage() {
  const result = await getMyCard();
  if (!result.ok && ["AUTH_REQUIRED", "NOT_FOUND", "CUSTOMER_RECOVERY_REVIEW"].includes(result.error.code)) redirect("/mi-tarjeta/acceso");
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-content space-y-6 px-4 py-8 focus:outline-none md:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-brand text-3xl font-bold">Mi tarjeta</h1><SignOut audience="customer" /></div>
    {result.ok ? <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
      <CardSummary card={result.data} />
      <div className="space-y-6">
        <SaveCardLink />
        <PreferencesForm card={result.data} />
        <section aria-labelledby="card-contact" className="rounded-card border border-brand-border p-4 md:p-6">
          <h2 id="card-contact" className="text-xl font-bold">Teléfono de contacto</h2>
          <p className="mt-2 text-brand-muted">Si pierdes el acceso a tu tarjeta, pide ayuda al personal en el local.</p>
          <Link className="inline-flex min-h-12 items-center font-semibold text-brand-action underline" href="/mi-tarjeta/telefono">Cambiar mi teléfono</Link>
        </section>
      </div>
    </div> : <p role="alert">{result.error.message}</p>}
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/">Volver a la carta</Link>
  </main></CatalogShell>;
}
