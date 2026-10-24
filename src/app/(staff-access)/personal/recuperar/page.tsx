import { AuthForm } from "@/features/identity/components/auth-form";

export const metadata = { title: "Recuperar acceso | Fuego y Brasas", robots: { index: false, follow: false } };

export default function StaffRecoveryPage() {
  return <AuthForm kind="recovery" />;
}
