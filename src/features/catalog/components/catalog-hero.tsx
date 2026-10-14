import Image from "next/image";
import Link from "next/link";

import { CATALOG_HERO_IMAGE } from "../media";

export function CatalogHero() {
  return (
    <section aria-labelledby="bienvenida-titulo" className="overflow-hidden rounded-card bg-brand-ink text-brand-surface">
      <div className="grid lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col items-start gap-5 p-6 md:p-8 lg:p-12">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-wide">
            <span aria-hidden="true" className="h-px w-8 bg-brand-gold" />Pollo a la brasa · Parcona
          </p>
          <h1 id="bienvenida-titulo" className="max-w-md font-brand text-brand-mobile font-bold md:text-brand-desktop">
            Sabor que une,<br /><span className="text-brand-gold">momentos que quedan.</span>
          </h1>
          <p className="max-w-md text-brand-surface/85">Pollo a la brasa, mostritos y alitas. Encuentra ese antojo para ti o para compartir.</p>
          <Link href="#carta" className="inline-flex min-h-12 items-center justify-center gap-4 rounded-button bg-brand-action px-6 font-semibold text-brand-surface transition-colors duration-feedback hover:bg-brand-action-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-surface motion-reduce:transition-none">
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
