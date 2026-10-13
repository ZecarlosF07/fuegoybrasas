import "server-only";

import type { CaptchaConfiguration } from "../types/auth";
import { getSiteEnvironment } from "@/lib/env/server";

export function getCaptchaSettings() {
  const provider = process.env.AUTH_CAPTCHA_PROVIDER;
  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
  const hostname = new URL(getSiteEnvironment().APP_SITE_URL).hostname;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  const config: CaptchaConfiguration = (provider === "turnstile" || provider === "hcaptcha") && siteKey ? { provider, siteKey } : null;
  return { config, ready: local || config !== null };
}
export function captchaAllows(token?: string) {
  const settings = getCaptchaSettings();
  return settings.ready && (!settings.config || Boolean(token));
}
