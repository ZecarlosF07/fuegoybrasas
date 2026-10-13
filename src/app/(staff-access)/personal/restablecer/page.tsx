import Link from "next/link";

import { AuthForm } from "@/features/identity/components/auth-form";
import { MfaForm } from "@/features/identity/components/mfa-form";
import { hasRecoveryPermission } from "@/features/identity/server/recovery-marker";
import { getStaffAccess } from "@/features/staff/server/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function StaffResetPage() {
  const access = await getStaffAccess();
  if (!access.ok || !await hasRecoveryPermission(access.data.authUserId)) return <>
    <h1 className="font-brand text-3xl font-bold">Solicita un nuevo enlace</h1>
    <p className="my-6">El enlace ya no es válido o esta cuenta no tiene acceso autorizado.</p>
    <Link href="/personal/recuperar" className="flex min-h-12 items-center text-brand-action underline">Recuperar contraseña</Link>
  </>;
  const client = await createServerSupabaseClient();
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) return <p role="alert">No pudimos comprobar el autenticador. Vuelve a intentar.</p>;
  const existingFactor = factors.data.totp[0];
  if (existingFactor && access.data.assuranceLevel !== "aal2") return <>
    <p className="mb-6">Antes de cambiar la contraseña, verifica el autenticador que ya tiene tu cuenta.</p>
    <MfaForm factorId={existingFactor.id} />
  </>;
  return <AuthForm kind="password" />;
}
