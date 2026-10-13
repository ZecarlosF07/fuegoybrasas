import { AuthForm } from "@/features/identity/components/auth-form";
import { getCaptchaSettings } from "@/features/identity/server/captcha";

export default async function StaffLoginPage({ searchParams }: PageProps<"/personal/acceso">) {
  const { estado } = await searchParams;
  const settings = getCaptchaSettings();
  return <>
    {estado === "enlace-invalido" && <p role="alert" className="mb-6 text-brand-danger">El enlace no es válido o ya se utilizó. Solicita uno nuevo.</p>}
    {estado === "sin-acceso" && <p role="alert" className="mb-6 text-brand-danger">Esta cuenta no tiene acceso autorizado. Consulta al responsable.</p>}
    <AuthForm kind="login" captcha={settings.config} ready={settings.ready} />
  </>;
}
