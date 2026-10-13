import { redirect } from "next/navigation";

import { MfaForm } from "@/features/identity/components/mfa-form";
import { SignOut } from "@/features/identity/components/sign-out";
import { getStaffAccess } from "@/features/staff/server/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function StaffMfaPage() {
  const access = await getStaffAccess();
  if (!access.ok && access.error.code === "AUTH_REQUIRED") redirect("/personal/acceso");
  if (!access.ok) return <><h1 className="font-brand text-3xl font-bold">Acceso no disponible</h1><p role="alert" className="my-6">{access.error.message}</p><SignOut /></>;
  const client = await createServerSupabaseClient();
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) return <p role="alert">No pudimos consultar el autenticador. Vuelve a intentar.</p>;
  return <MfaForm factorId={factors.data.totp[0]?.id ?? null} />;
}
