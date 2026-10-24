import Link from "next/link";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { LOYALTY_TERMS_VERSION } from "@/features/loyalty/constants";
import { getCardAccessSettings } from "@/features/loyalty/server/access-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Condiciones de la tarjeta | Fuego y Brasas" };
export default function CardTermsPage() {
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl space-y-6 px-4 py-8 focus:outline-none">
    <h1 className="font-brand text-3xl font-bold">Condiciones de la tarjeta</h1>
    <p className="text-sm text-brand-muted">Versión {LOYALTY_TERMS_VERSION}</p>
    {!getCardAccessSettings().ready && <p role="status">Propuesta para revisión del negocio. La participación pública aún no está habilitada.</p>}
    <section className="space-y-4"><h2 className="text-xl font-bold">Participación opcional</h2><p>Puedes pedir como invitado. Creas tu tarjeta con nombre, teléfono peruano de contacto y aceptación de estas condiciones. No necesitas contraseña ni código SMS. Se conserva una tarjeta por teléfono registrado y empieza sin sellos.</p>
      <p>Este celular recuerda tu acceso. Guarda también tu enlace privado o QR; no lo publiques ni lo compartas, porque permite abrir tu tarjeta. Escribir un teléfono no permite consultar ni recuperar una tarjeta ajena.</p></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Visitas y premios</h2><p>Una visita presencial con compra pagada y pedido entregado genera un sello cuando el personal lo confirma. Varios platos en una visita cuentan como un sello. Abrir WhatsApp o cancelar antes de la entrega no genera un sello.</p>
      <p>Diez sellos generan un Mostrito de ⅛ con chaufa, papas fritas y ensalada. El premio se canjea en otra visita, que puede ser el mismo día, sin compra obligatoria. El canje no suma sello ni borra el avance del siguiente ciclo. El programa inicial no establece vencimiento de sellos o premios.</p>
      <p>Si el producto está agotado, el premio permanece disponible. La pausa del programa conserva tu progreso y premios, aunque impide nuevas acreditaciones y canjes.</p></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Revisión y atención</h2><p>El personal confirma la entrega física y registra los movimientos. Un error se revisa conservando el historial. Si un canje registrado finalmente no se entrega, el administrador puede restituir el premio tras comprobar lo sucedido y registrar el motivo en una incidencia.</p>
      <p>Puedes cambiar el teléfono de contacto desde tu tarjeta abierta, sin SMS; el progreso y los premios se conservan. Si perdiste el acceso guardado y el enlace, el administrador puede recuperar tu acceso presencialmente, comprobando una referencia de compra y el historial. El teléfono por sí solo no basta. Los clientes y sus tarjetas se conservan; no hay una baja automática en la aplicación.</p></section>
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/privacidad">Leer el uso de tus datos</Link>
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/mi-tarjeta/acceso">Volver a mi tarjeta</Link>
  </main></CatalogShell>;
}
