"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getPrivateCardLinkAction, openCardLinkAction } from "../server/card-access-actions";
import type { CardLinkDestination, PrivateCardLink } from "../types/loyalty";
import { cardKeySchema } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { TextField } from "@/components/ui/text-field";
import { failure } from "@/contracts/services/result";

export function OpenCardLink() {
  const [key, setKey] = useState<string | null>(null);
  const work = useServerWork<CardLinkDestination>();
  const { setError } = work;
  useEffect(() => {
    function readFragment() {
      if (!window.location.hash) return;
      const parsed = cardKeySchema.safeParse(new URLSearchParams(window.location.hash.slice(1)).get("tarjeta"));
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      queueMicrotask(() => { setKey(parsed.success ? parsed.data : null); setError(null); });
    }
    readFragment();
    window.addEventListener("hashchange", readFragment);
    return () => window.removeEventListener("hashchange", readFragment);
  }, [setError]);
  if (!key) return <p className="text-brand-muted">Si ya tienes tarjeta, ábrela desde su enlace privado guardado. Si lo perdiste, solicita revisión al personal; escribir tu teléfono no recupera el acceso.</p>;
  async function open() {
    const result = await work.execute(() => openCardLinkAction(key));
    if (result?.ok) window.location.replace(result.data.destination);
  }
  return <section className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Tu enlace de tarjeta</h2><p>Abre esta tarjeta en este celular. El enlace es privado y debe pertenecer a ti.</p>
    <FormFeedback error={work.error} /><Button onClick={open} disabled={work.pending} aria-busy={work.pending}>{work.pending ? "Abriendo tarjeta…" : "Abrir mi tarjeta"}</Button>
  </section>;
}

export function SaveCardLink() {
  const [value, setValue] = useState<PrivateCardLink | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const work = useServerWork<PrivateCardLink>();
  async function copy() {
    setMessage(null);
    const result = await work.execute(async () => {
      const link = await getPrivateCardLinkAction();
      if (!link.ok) return link;
      setValue(link.data);
      try { await navigator.clipboard.writeText(link.data.link); }
      catch { return failure({ code: "SERVICE_UNAVAILABLE", message: "El enlace está preparado, pero no se pudo copiar. Selecciona el texto visible y guárdalo en privado." }, link.requestId); }
      return link;
    });
    if (result?.ok) setMessage("Enlace copiado. Guárdalo en un lugar privado para volver a abrir tu tarjeta.");
  }
  return <section className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-xl font-bold">Guardar mi tarjeta</h2><p>Este celular recuerda tu tarjeta. Guarda también su enlace para abrirla en otro dispositivo. Cualquier persona con el enlace podrá ver tu tarjeta y tus indicaciones; no lo publiques.</p>
    <Button variant="secondary" onClick={copy} disabled={work.pending} aria-busy={work.pending}>{work.pending ? "Preparando enlace privado…" : "Copiar enlace y mostrar QR"}</Button>
    <FormFeedback error={work.error} message={message} />
    {value && <div className="space-y-4"><TextField id="privateCardLink" label="Enlace privado de mi tarjeta" value={value.link} readOnly help="Si no se pudo copiar, selecciona este texto y guárdalo. No lo compartas con otras personas." />
      <Image src={value.qr} alt="QR privado para abrir esta tarjeta" width={256} height={256} unoptimized className="max-w-full" /></div>}
  </section>;
}
