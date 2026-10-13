"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { LOYALTY_TERMS_VERSION } from "../constants";
import { registerCardAction } from "../server/card-access-actions";
import type { ActivationProps, Card } from "../types/loyalty";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { SignOut } from "@/features/identity/components/sign-out";

export function ActivateCard({ offer, accessReady }: ActivationProps) {
  const work = useServerWork<Card>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await work.execute(() => registerCardAction({ displayName: form.get("displayName"), phone: form.get("phone"), termsVersion: offer.termsVersion, termsAccepted: form.get("termsAccepted") === "on" }));
    if (result?.ok) window.location.replace("/mi-tarjeta");
  }
  const ready = accessReady && offer.enabled && offer.termsVersion === LOYALTY_TERMS_VERSION;
  return <div className="space-y-6"><form method="post" onSubmit={submit} noValidate className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h1 className="font-brand text-3xl font-bold">Crear mi tarjeta</h1>
    <p>Solo tu nombre y teléfono. Sin contraseña ni códigos SMS; este celular recordará tu tarjeta.</p>
    <p>Diez visitas presenciales con compra pagada y entregada generan un Mostrito de ⅛. Tu tarjeta empieza sin sellos.</p>
    {!ready && <p role="status">El programa está pausado o sus condiciones necesitan revisión. Puedes pedir como invitado.</p>}
    <FormFeedback error={work.error} />
    <TextField id="displayName" name="displayName" label="Tu nombre" autoComplete="given-name" maxLength={80} disabled={work.pending || !ready} error={work.error?.fieldErrors?.displayName?.[0]} required />
    <TextField id="phone" name="phone" label="Tu celular peruano" autoComplete="tel" inputMode="tel" maxLength={24} disabled={work.pending || !ready} error={work.error?.fieldErrors?.phone?.[0]} help="Es un dato de contacto; no permite abrir otras tarjetas." required />
    <CheckboxField id="termsAccepted" name="termsAccepted" label="Leí y acepto las condiciones vigentes de la tarjeta" disabled={work.pending || !ready} />
    <Link href="/condiciones-tarjeta" className="inline-flex min-h-12 items-center text-brand-action underline">Leer condiciones</Link>
    <SubmitButton pending={work.pending} label="Crear mi tarjeta" pendingLabel="Creando tarjeta…" disabled={!ready} />
  </form><SignOut audience="customer" /></div>;
}
