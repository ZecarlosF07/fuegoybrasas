"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { lookupCustomerAction } from "../server/actions";
import type { LookupResult } from "../types/loyalty";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function CustomerLookup() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const work = useServerWork<LookupResult>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null);
    const phone = new FormData(event.currentTarget).get("phone");
    const result = await work.execute(() => lookupCustomerAction(phone));
    if (!result?.ok) return;
    if (!result.data.found) { setMessage("No encontramos una tarjeta con ese teléfono de contacto. El cliente puede crear su tarjeta en la web."); return; }
    router.push("/personal/clientes/" + result.data.card.customerId);
  }
  return <form method="post" onSubmit={submit} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Buscar tarjeta del cliente</h2>
    <FormFeedback error={work.error} message={message} />
    <TextField id="phone" name="phone" type="tel" label="Celular peruano del cliente" autoComplete="off" inputMode="tel" placeholder="Ej. 987 654 321" maxLength={24} disabled={work.pending} required />
    <SubmitButton pending={work.pending} label="Buscar tarjeta" pendingLabel="Buscando tarjeta…" />
    <p className="text-sm text-brand-muted">Antes de registrar una operación, coteja la tarjeta presentada, el nombre y el último movimiento con el cliente.</p>
  </form>;
}
