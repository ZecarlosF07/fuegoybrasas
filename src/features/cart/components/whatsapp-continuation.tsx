"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";


import { useCart } from "./cart-provider";
import { prepareMessage } from "../services/message";
import type { PreparedMessage } from "../types/cart";
import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import type { Result } from "@/contracts/types/result";

export function WhatsAppContinuation() {
  const cart = useCart();
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const text = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const check = () => setExpired(performance.now() >= cart.deadline);
    const timer = setInterval(check, 500);
    check();
    return () => clearInterval(timer);
  }, [cart.deadline]);
  const result = cart.validated;
  if (!result || result.status !== "ready") return <div className="space-y-4"><p>Necesitamos revisar el pedido antes de preparar WhatsApp. Tu borrador está conservado.</p><Button aria-busy={cart.validating} disabled={cart.validating} onClick={cart.validate}>{cart.validating ? "Revisando pedido…" : "Revalidar pedido"}</Button><Link href="/pedido" className="inline-flex min-h-12 items-center underline">Revisar mis platos</Link></div>;
  let prepared: PreparedMessage;
  try { prepared = prepareMessage(result, cart.draft); }
  catch (cause) { return <p role="alert">{cause instanceof Error ? cause.message : "Revisa el pedido antes de continuar."} <Link href="/pedido" className="underline">Volver a mi pedido</Link></p>; }
  async function copy(): Promise<Result<void>> {
    if (!prepared || performance.now() >= cart.deadline) return { ok: false, error: { code: "CATALOG_CHANGED", message: "La revisión expiró. Revalida antes de copiar." }, requestId: crypto.randomUUID() };
    try { await navigator.clipboard.writeText(prepared.message); setNotice("Mensaje copiado. Pégalo en el chat para coordinar tu pedido."); return { ok: true, data: undefined, requestId: crypto.randomUUID() }; }
    catch { text.current?.focus(); text.current?.select(); return { ok: false, error: { code: "SERVICE_UNAVAILABLE", message: "No pudimos copiar. El texto está seleccionado para copiarlo manualmente." }, requestId: crypto.randomUUID() }; }
  }
  return <section className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
    <h2 className="text-product font-semibold">Solicitud preparada</h2><p>Abrir WhatsApp no confirma una venta. Envía el mensaje y espera la confirmación del local.</p>
    <label htmlFor="whatsapp-message" className="block font-semibold">Mensaje completo para WhatsApp</label>
    <textarea ref={text} id="whatsapp-message" readOnly value={prepared.message} rows={14} className="w-full rounded-field border border-brand-control-border bg-brand-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action" />
    {prepared.long && <p>El mensaje es largo. Copia el texto íntegro y pégalo después de abrir el chat.</p>}
    {expired ? <div className="space-y-3"><p role="status">La revisión venció. Revalida precios y disponibilidad para continuar.</p><Button disabled={cart.validating} aria-busy={cart.validating} onClick={cart.validate}>{cart.validating ? "Revisando pedido…" : "Revalidar antes de abrir WhatsApp"}</Button></div> : <a href={prepared.url} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")} onClick={(event) => {
      if (performance.now() >= cart.deadline || cart.external || cart.blocked) { event.preventDefault(); setExpired(true); return; }
      setNotice("El chat se abre en otra ventana. Si no aparece, copia el mensaje y vuelve a intentarlo. Conservamos tu borrador.");
    }}>Abrir WhatsApp</a>}
    <AsyncButton label="Copiar mensaje completo" pendingLabel="Copiando mensaje…" action={copy} disabled={expired || cart.validating || cart.external} variant="secondary" />
    {notice && <p role="status">{notice}</p>}
    <Link href="/pedido" className="inline-flex min-h-12 items-center underline">Volver y editar pedido</Link>
  </section>;
}