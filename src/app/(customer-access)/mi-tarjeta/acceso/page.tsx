import Link from "next/link";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { ActivateCard } from "@/features/loyalty/components/activate-card";
import { OpenCardLink } from "@/features/loyalty/components/card-link";
import { getCardAccessSettings } from "@/features/loyalty/server/access-settings";
import { getLoyaltyOffer, getMyCard } from "@/features/loyalty/server/read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi tarjeta | Fuego y Brasas", robots: { index: false, follow: false } };
export default async function CustomerAccessPage() {
  const card = await getMyCard();
  const offer = !card.ok && ["AUTH_REQUIRED", "NOT_FOUND"].includes(card.error.code) ? await getLoyaltyOffer() : null;
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-2xl space-y-6 px-4 py-8 focus:outline-none">
    <OpenCardLink />
    {card.ok ? <><h1 className="font-brand text-3xl font-bold">Tu tarjeta está guardada</h1><Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/mi-tarjeta">Volver a mi tarjeta</Link></> : offer?.ok ? <ActivateCard offer={offer.data} accessReady={getCardAccessSettings().ready} /> : <><h1 className="font-brand text-3xl font-bold">Revisar mi tarjeta</h1><p role="alert">{card.error.code === "NOT_FOUND" ? "No pudimos consultar el programa. Intenta nuevamente." : card.error.message}</p></>}
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/">Seguir como invitado</Link>
  </main></CatalogShell>;
}
