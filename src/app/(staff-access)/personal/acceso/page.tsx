import { AuthForm } from "@/features/identity/components/auth-form";

export const metadata = { title: "Acceso del personal | Fuego y Brasas", robots: { index: false, follow: false } };

export default async function StaffLoginPage({ searchParams }: PageProps<"/personal/acceso">) {
  const { estado } = await searchParams;
  return <>
    {estado === "enlace-invalido" && <p role="alert" className="mb-6 text-brand-danger">El enlace no es válido o ya se utilizó. Solicita uno nuevo.</p>}
    {estado === "sin-acceso" && <p role="alert" className="mb-6 text-brand-danger">Esta cuenta no tiene acceso autorizado. Consulta al responsable.</p>}
    <AuthForm kind="login" />
  </>;
}
