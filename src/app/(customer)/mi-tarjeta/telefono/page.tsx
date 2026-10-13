import { redirect } from "next/navigation";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { ContactForm } from "@/features/loyalty/components/contact-form";
import { getMyCard } from "@/features/loyalty/server/read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cambiar teléfono | Fuego y Brasas", robots: { index: false, follow: false } };
export default async function ChangePhonePage() {
  const card = await getMyCard();
  if (!card.ok && card.error.code !== "SERVICE_UNAVAILABLE") redirect("/mi-tarjeta/acceso");
  return <CatalogShell showCartDock={false}><main className="mx-auto max-w-2xl px-4 py-8">
    {card.ok ? <ContactForm card={card.data} /> : <p role="alert">{card.error.message}</p>}
  </main></CatalogShell>;
}
