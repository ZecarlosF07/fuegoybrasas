import Link from "next/link";

import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { getCardAccessSettings } from "@/features/loyalty/server/access-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uso de tus datos | Fuego y Brasas" };
export default function PrivacyPage() {
  return <CatalogShell showCartDock={false}><main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl space-y-6 px-4 py-8 focus:outline-none">
    <h1 className="font-brand text-3xl font-bold">Uso de tus datos</h1>
    {!getCardAccessSettings().ready && <p role="status">Propuesta para revisión del negocio. Faltan aprobar el aviso y los plazos de conservación antes del lanzamiento de la tarjeta.</p>}
    <section className="space-y-4"><h2 className="text-xl font-bold">Tu tarjeta</h2><p>Creas tu tarjeta con nombre y teléfono de contacto, sin verificación SMS. Una clave privada guardada en este navegador permite consultar tu tarjeta; en Supabase se conserva solo su hash. El perfil guarda tu aceptación de condiciones y las indicaciones que decidas guardar. El personal autorizado puede localizarte por el teléfono declarado y confirmar tu tarjeta antes de registrar visitas o canjes.</p>
      <p>El acceso guardado y el enlace privado tienen una vigencia técnica de un año. Guarda el enlace en un lugar privado: quien lo tenga podrá consultar tu tarjeta y tus indicaciones. Cerrar sesión borra el acceso de este navegador; no cancela un enlace que ya hayas guardado. Estos tiempos de acceso no fijan el plazo de conservación de tus datos o premios.</p>
      <p>Las indicaciones frecuentes se pueden editar o borrar. No inferimos tus preferencias desde ventas ni guardamos un historial de platos comprados. La tarjeta no activa publicidad automática.</p></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Tu pedido invitado</h2><p>Los productos y cantidades del borrador se conservan en este dispositivo. Las indicaciones opcionales del pedido se conservan en la sesión del navegador. Las solicitudes preparadas no se almacenan en Supabase. Cuando continúas por WhatsApp, decides enviar el mensaje y coordinar allí la entrega y el costo de envío.</p>
      <p>Cerrar sesión elimina la vista privada y el formulario sensible, conservando los productos del borrador. Si se pierden indicaciones, el pedido requiere revisión expresa.</p></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Revisión de datos</h2><p>Los movimientos y registros de operación se conservan para revisar duplicados y errores. La aplicación conserva los clientes y sus tarjetas. Los plazos y el procedimiento para solicitudes de datos están pendientes de aprobación del negocio.</p>
      <p>Solicita atención al responsable de Fuego y Brasas. Esta información describe el funcionamiento previsto y no afirma una certificación legal.</p></section>
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/condiciones-tarjeta">Condiciones de la tarjeta</Link>
    <Link className="inline-flex min-h-12 items-center text-brand-action underline" href="/">Volver a la carta</Link>
  </main></CatalogShell>;
}
