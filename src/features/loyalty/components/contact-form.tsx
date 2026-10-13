"use client";

import type { FormEvent } from "react";

import { changeCardContactAction } from "../server/card-access-actions";
import type { Card, CardProps } from "../types/loyalty";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function ContactForm({ card }: CardProps) {
  const work = useServerWork<Card>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await work.execute(() => changeCardContactAction({ phone: form.get("phone"), expectedRevision: card.profileRevision }));
    if (result?.ok) window.location.replace("/mi-tarjeta");
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h1 className="font-brand text-3xl font-bold">Cambiar mi teléfono de contacto</h1>
    <p>El número ayuda al personal a localizarte. No se envían códigos SMS y tu tarjeta, sellos y premios se conservan.</p>
    <FormFeedback error={work.error} />
    <TextField id="phone" name="phone" label="Nuevo celular peruano" autoComplete="tel" inputMode="tel" maxLength={24} disabled={work.pending} error={work.error?.fieldErrors?.phone?.[0]} required />
    <SubmitButton pending={work.pending} label="Guardar teléfono de contacto" pendingLabel="Guardando contacto…" />
  </form>;
}
