"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { updatePreferencesAction } from "../server/actions";
import type { Card, CardProps } from "../types/loyalty";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function PreferencesForm({ card: initial }: CardProps) {
  const router = useRouter();
  const [card, setCard] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const work = useServerWork<Card>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const result = await work.execute(() => updatePreferencesAction({ displayName: form.get("displayName"), frequentInstructions: form.get("frequentInstructions"), expectedRevision: card.profileRevision }));
    if (!result?.ok) return;
    router.refresh();
    setCard(result.data); setMessage("Indicaciones guardadas. Solo se usarán en tu pedido cuando tú las apliques.");
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Mis indicaciones frecuentes</h2><p className="text-brand-muted">Puedes cambiarlas o borrarlas. Lo escrito en un pedido no actualiza este perfil.</p>
    <FormFeedback error={work.error} message={message} />
    <fieldset disabled={work.pending} className="space-y-4" key={card.profileRevision}>
      <TextField id="displayName" name="displayName" label="Tu nombre" defaultValue={card.displayName} maxLength={80} error={work.error?.fieldErrors?.displayName?.[0]} required />
      <TextField id="frequentInstructions" name="frequentInstructions" label="Indicaciones frecuentes (opcional)" defaultValue={card.frequentInstructions} maxLength={500} help="Evita incluir datos que no sean necesarios para preparar tu comida." error={work.error?.fieldErrors?.frequentInstructions?.[0]} />
    </fieldset>
    <SubmitButton pending={work.pending} label="Guardar indicaciones" pendingLabel="Guardando indicaciones…" />
    {work.error && <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Consultar la tarjeta actual</Button>}
  </form>;
}
