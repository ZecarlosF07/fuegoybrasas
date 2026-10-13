import { AuthForm } from "@/features/identity/components/auth-form";
import { getCaptchaSettings } from "@/features/identity/server/captcha";

export default function StaffRecoveryPage() {
  const settings = getCaptchaSettings();
  return <AuthForm kind="recovery" captcha={settings.config} ready={settings.ready} />;
}
