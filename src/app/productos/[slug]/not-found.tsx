import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-classes";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";

export default function ProductNotFound() {
  return <CatalogShell><main id="contenido" tabIndex={-1} className="mx-auto max-w-content px-4 py-12 focus:outline-none md:px-6 lg:px-8">
    <h1 className="font-brand text-brand-mobile font-bold">Este producto no está disponible</h1>
    <p className="mb-6 mt-4 text-brand-muted">Puedes encontrar otros platos y promociones en nuestra carta.</p>
    <Link href="/#carta" className={buttonClasses("primary")}>Ver carta</Link>
  </main></CatalogShell>;
}
