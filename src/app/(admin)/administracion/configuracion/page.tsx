import { ConfigForm } from "@/features/business-config/components/config-form";
import { configSchema } from "@/features/business-config/validation/schemas";
import { CheckoutConfigPanel } from "@/features/checkout-config/components/checkout-config-panel";
import { ProgramPanel } from "@/features/loyalty/components/program-panel";
import { getCardAccessSettings } from "@/features/loyalty/server/access-settings";
import { getPrograms } from "@/features/loyalty/server/read";
import { requireStaffPage } from "@/features/staff/server/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Configuración del negocio | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function ConfigurationPage() {
  const access = await requireStaffPage(true);
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const client = await createServerSupabaseClient();
  const response = await client.rpc("get_admin_config");
  const parsed = configSchema.safeParse(response.data);
  if (response.error || !parsed.success) return <p role="alert">No pudimos leer la configuración. Vuelve a intentar sin iniciar un guardado.</p>;
  const programs = await getPrograms();
  const sections = [
    { id: "datos-local", label: "Datos y horarios" },
    { id: "condiciones-pedido", label: "Condiciones del pedido" },
    { id: "programa-fidelizacion", label: "Tarjeta de fidelización" },
  ];
  return <div className="space-y-6">
    <h1 className="font-brand text-3xl font-bold">Configuración del local</h1>
    <nav aria-label="Secciones de configuración" className="flex flex-wrap gap-x-6 gap-y-2 rounded-card border border-brand-border bg-brand-subtle px-4 py-2">
      {sections.map(({ id, label }) => <a key={id} href={`#${id}`} className="inline-flex min-h-12 items-center font-semibold text-brand-action underline">{label}</a>)}
    </nav>
    <div id="datos-local" tabIndex={-1} className="scroll-mt-6"><ConfigForm initial={parsed.data} actorUserId={access.data.authUserId} /></div>
    <div id="condiciones-pedido" tabIndex={-1} className="flow-root scroll-mt-6"><CheckoutConfigPanel initial={parsed.data} actorUserId={access.data.authUserId} /></div>
    <div id="programa-fidelizacion" tabIndex={-1} className="scroll-mt-6">{programs.ok ? <ProgramPanel initial={programs.data} actorUserId={access.data.authUserId} launchReady={getCardAccessSettings().ready} /> : <p role="alert">{programs.error.message}</p>}</div>
  </div>;
}
