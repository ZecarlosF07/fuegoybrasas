"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { completePasswordAction, requestPasswordRecoveryAction, signInStaffAction } from "@/features/identity/server/actions";
import type { AuthFormProps, AuthFormResult } from "@/features/identity/types/auth";

const COPY = {
  login: { title: "Bienvenido de nuevo", help: "Ingresa con tu cuenta personal para atender o administrar el local.", button: "Ingresar", pending: "Verificando acceso…" },
  recovery: { title: "Recuperar contraseña", help: "Te enviaremos instrucciones si la cuenta puede recuperar su acceso. El autenticador seguirá siendo necesario.", button: "Enviar instrucciones", pending: "Solicitando instrucciones…" },
  password: { title: "Nueva contraseña", help: "Usa al menos 12 caracteres. La recuperación conserva tu autenticador y tus permisos actuales.", button: "Guardar contraseña", pending: "Guardando contraseña…" },
};
export function AuthForm({ kind }: AuthFormProps) {
  const work = useServerWork<AuthFormResult>();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = COPY[kind];
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    const action = kind === "login" ? signInStaffAction : kind === "recovery" ? requestPasswordRecoveryAction : completePasswordAction;
    const result = await work.execute(() => action(input));
    if (!result?.ok) return;
    if (result.data.destination) window.location.replace(result.data.destination);
    if (result.data.message) setMessage(result.data.message);
  }
  return <div>
    <h1 className="font-brand text-3xl font-bold leading-tight">{copy.title}</h1>
    <p className="mt-3 text-brand-muted">{copy.help}</p>
    <form method="post" onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
      <FormFeedback error={work.error} message={message} />
      {kind !== "password" && <TextField id="email" name="email" label="Correo electrónico" type="email" autoComplete="username" inputMode="email" required disabled={work.pending} error={work.error?.fieldErrors?.email?.[0]} />}
      {kind !== "recovery" && <>
        <TextField id="password" name="password" label={kind === "password" ? "Nueva contraseña" : "Contraseña"} type={visible ? "text" : "password"} autoComplete={kind === "password" ? "new-password" : "current-password"} required disabled={work.pending} error={work.error?.fieldErrors?.password?.[0]} />
        {kind === "password" && <TextField id="confirmation" name="confirmation" label="Repite la contraseña" type={visible ? "text" : "password"} autoComplete="new-password" required disabled={work.pending} error={work.error?.fieldErrors?.confirmation?.[0]} />}
        <Button variant="secondary" onClick={() => setVisible((value) => !value)} aria-pressed={visible}>{visible ? "Ocultar contraseñas" : "Mostrar contraseña"}</Button>
      </>}
      <SubmitButton pending={work.pending} label={copy.button} pendingLabel={copy.pending} />
    </form>
    <Link href={kind === "login" ? "/personal/recuperar" : "/personal/acceso"} className="mt-6 flex min-h-12 items-center text-brand-action underline">{kind === "login" ? "Olvidé mi contraseña" : "Volver al acceso"}</Link>
  </div>;
}
