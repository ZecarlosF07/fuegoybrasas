import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-classes";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";

export default function NotFoundPage() {
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-2xl space-y-6 px-4 py-16 focus:outline-none">
    <p className="font-semibold text-brand-action">Página no disponible</p>
    <h1 className="font-brand text-brand-mobile font-bold md:text-brand-desktop">No encontramos esta página</h1>
    <p className="text-brand-muted">Puedes volver a la carta y seguir eligiendo tus platos. Tu pedido guardado se conserva.</p>
    <Link href="/" className={buttonClasses("primary")}>Volver a la carta</Link>
  </main></CatalogShell>;
}
