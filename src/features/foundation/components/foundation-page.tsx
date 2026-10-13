import { OFFICIAL_FACEBOOK_URL } from "../constants";
import { buttonClasses } from "@/components/ui/button-classes";


export function FoundationPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 md:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border py-6">
        <p className="font-brand text-xl font-bold">Fuego y Brasas</p>
        <span className="text-sm text-brand-muted">Pollería · Carnes · Boxes</span>
      </header>
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col justify-center gap-6 py-16 focus:outline-none">
        <div aria-hidden="true" className="h-1 w-12 rounded-full bg-brand-gold" />
        <p className="font-semibold text-brand-action">Fuego y Brasas</p>
        <h1 className="max-w-2xl text-balance font-brand text-brand-mobile font-bold md:text-brand-desktop">
          Sabor que une,<br />momentos que quedan.
        </h1>
        <p className="max-w-lg text-pretty text-brand-muted">
          Estamos preparando nuestra carta en línea para que encuentres tus favoritos con facilidad.
        </p>
        <a className={`${buttonClasses("primary")} self-start`} href={OFFICIAL_FACEBOOK_URL}>
          Conoce Fuego y Brasas
        </a>
      </main>
      <footer className="border-t border-brand-border py-6 text-sm text-brand-muted">
        Hecho con pasión. Compartido con cariño.
      </footer>
    </div>
  );
}
