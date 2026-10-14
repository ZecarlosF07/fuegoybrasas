import Link from "next/link";

import { AuthForm } from "@/features/identity/components/auth-form";
import { hasRecoveryPermission } from "@/features/identity/server/recovery-marker";
import { getStaffAccess } from "@/features/staff/server/access";

export default async function StaffResetPage() {
  const access = await getStaffAccess();
  if (!access.ok || !await hasRecoveryPermission(access.data.authUserId)) return <>
    <h1 className="font-brand text-3xl font-bold">Solicita un nuevo enlace</h1>
    <p className="my-6">El enlace ya no es válido o esta cuenta no tiene acceso autorizado.</p>
    <Link href="/personal/recuperar" className="flex min-h-12 items-center text-brand-action underline">Recuperar contraseña</Link>
  </>;
  return <AuthForm kind="password" />;
}
