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
  return <><ConfigForm initial={parsed.data} actorUserId={access.data.authUserId} /><CheckoutConfigPanel initial={parsed.data} actorUserId={access.data.authUserId} />
    {programs.ok ? <ProgramPanel initial={programs.data} actorUserId={access.data.authUserId} launchReady={getCardAccessSettings().ready} /> : <p role="alert">{programs.error.message}</p>}</>;
}
