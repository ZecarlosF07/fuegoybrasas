"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { CaptchaProps } from "../types/auth";

export function Captcha({ config, onToken, onError, resetKey }: CaptchaProps) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const api = window[config.provider];
    if (!ready || !api || !container.current) return;
    const id = api.render(container.current, { sitekey: config.siteKey, callback: onToken,
      "expired-callback": () => onToken(""), "error-callback": () => { onToken(""); onError("No se pudo completar la verificación de seguridad. Recarga la página para intentar nuevamente."); }, theme: "light", size: config.provider === "turnstile" ? "flexible" : "compact" });
    return () => { api.remove(id); };
  }, [config, ready, onToken, onError, resetKey]);
  return <div>
    <Script src={config.provider === "turnstile" ? "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" : "https://js.hcaptcha.com/1/api.js?render=explicit"}
      onReady={() => setReady(true)} onError={() => onError("No se pudo cargar la verificación de seguridad. Intenta recargar la página.")} />
    <div ref={container} />
  </div>;
}
