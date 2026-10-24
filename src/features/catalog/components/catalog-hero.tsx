import Image from "next/image";
import Link from "next/link";

import { CATALOG_HERO_IMAGE } from "../media";
import { buttonClasses } from "@/components/ui/button-classes";

export function CatalogHero() {
  return (
    <section aria-labelledby="bienvenida-titulo" className="overflow-hidden rounded-card border border-brand-border bg-brand-surface">
      <div className="grid lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col items-start gap-4 p-5 md:p-8 lg:p-10">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-wide">
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-brand-primary" />Pollo a la brasa · Parcona
          </p>
          <h1 id="bienvenida-titulo" className="max-w-md font-brand text-brand-mobile font-bold md:text-brand-desktop">
            Sabor que une,<br /><span className="text-brand-action">momentos que quedan.</span>
          </h1>
          <p className="max-w-md text-brand-muted">Pollo a la brasa, mostritos y alitas. Elige tus platos y continúa por WhatsApp.</p>
          <Link href="#carta" className={buttonClasses("primary")}>
            Explorar la carta<span aria-hidden="true">→</span>
          </Link>
        </div>
        <figure className="relative aspect-3/2 w-full min-w-0 bg-brand-ink">
          <Image src={CATALOG_HERO_IMAGE} alt="Imagen referencial de pollo a la brasa con papas, ensalada y cremas" fill sizes="(max-width: 1023px) calc(100vw - 32px), 600px" preload className="object-contain" />
          <figcaption className="absolute bottom-4 left-4 rounded-field bg-brand-ink/90 px-3 py-1 text-sm text-brand-surface">Imagen referencial</figcaption>
        </figure>
      </div>
    </section>
  );
}
