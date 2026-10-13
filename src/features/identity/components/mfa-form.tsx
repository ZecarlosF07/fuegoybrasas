"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { SignOut } from "@/features/identity/components/sign-out";
import { enrollStaffMfaAction, verifyStaffMfaAction } from "@/features/identity/server/mfa-actions";
import type { Enrollment, MfaFormProps } from "@/features/identity/types/auth";

export function MfaForm({ factorId }: MfaFormProps) {
  const enrollment = useServerWork<Enrollment>();
  const verification = useServerWork<{ destination: string }>();
  const [setup, setSetup] = useState<Enrollment | null>(null);
  const activeFactor = factorId ?? setup?.factorId;
  async function enroll() {
    const result = await enrollment.execute(enrollStaffMfaAction);
    if (result?.ok) setSetup(result.data);
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    const result = await verification.execute(() => verifyStaffMfaAction({ factorId: activeFactor, code }));
    if (result?.ok) window.location.replace(result.data.destination);
  }
  return <div className="space-y-6">
    <div><h1 className="font-brand text-3xl font-bold leading-tight">Segunda verificación</h1>
      <p className="mt-3 text-brand-muted">El código de tu autenticador protege el acceso a las funciones del local.</p></div>
    <FormFeedback error={enrollment.error ?? verification.error} />
    {!activeFactor && <div className="space-y-4">
      <p>Primero vincula una aplicación de autenticación en tu teléfono.</p>
      <Button onClick={enroll} disabled={enrollment.pending} aria-busy={enrollment.pending} className="w-full">
        {enrollment.pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
        {enrollment.pending ? "Preparando autenticador…" : "Configurar autenticador"}
      </Button>
    </div>}
    {setup && <div className="space-y-4">
      <p>Escanea este código con tu autenticador. No compartas el código ni la clave.</p>
      <Image src={setup.qrCode} width={240} height={240} unoptimized alt="Código QR para vincular tu autenticador" className="mx-auto h-auto max-w-full" />
      <details><summary className="min-h-12 cursor-pointer text-brand-action underline">Usar clave manual</summary><p className="mt-2 break-all font-mono">{setup.secret}</p></details>
    </div>}
    {activeFactor && <form method="post" onSubmit={verify} noValidate className="space-y-6">
      <TextField id="code" name="code" label="Código de seis dígitos" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={verification.pending} error={verification.error?.fieldErrors?.code?.[0]} />
      <SubmitButton pending={verification.pending} label="Verificar e ingresar" pendingLabel="Verificando código…" />
    </form>}
    <p className="text-sm text-brand-muted">Si perdiste el autenticador, consulta al responsable. Recuperar la contraseña conserva esta verificación.</p>
    <SignOut />
  </div>;
}
