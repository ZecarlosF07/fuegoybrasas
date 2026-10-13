import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "../../src/components/ui/button";
import { StatusMessage } from "../../src/components/ui/status-message";
import { TextField } from "../../src/components/ui/text-field";

export const markup = renderToStaticMarkup(
  <section className="flex max-w-lg flex-col gap-6" aria-label="Primitivas de prueba">
    <h1 className="font-brand text-brand-mobile font-bold">Controles compartidos</h1>
    <TextField id="sample-name" label="Nombre" defaultValue="Cliente de prueba" help="Datos sintéticos para revisión." error="Revisa este dato." />
    <Button>Guardar</Button>
    <Button disabled aria-busy="true">Guardando…</Button>
    <StatusMessage tone="error">No se pudo guardar. Los datos se conservan.</StatusMessage>
    <StatusMessage tone="success">Cambios guardados.</StatusMessage>
  </section>,
);
