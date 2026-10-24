"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { CartLineEditor } from "./cart-line";
import { useCart } from "./cart-provider";
import { CartRecovery } from "./cart-recovery";
import { CartReview } from "./cart-review";
import { CheckoutFields } from "./checkout-fields";
import { WhatsAppContinuation } from "./whatsapp-continuation";
import { provisionalSubtotal } from "../services/draft";
import type { CartPageProps } from "../types/cart";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatPen } from "@/lib/money/utils";

export function CartFlow({ catalog, step }: CartPageProps) {
  const cart = useCart();
  const router = useRouter();
  const [confirmNew, setConfirmNew] = useState(false);
  const unavailable = !cart.ready || cart.blocked || cart.expired || cart.external;
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await cart.validate()) router.push("/pedido/continuar");
  }
  return <main id="contenido" tabIndex={-1} className="mx-auto max-w-content space-y-6 px-4 py-8 focus:outline-none md:px-6 lg:px-8">
    <div><p className="mb-2 text-sm font-semibold text-brand-gold-ink">Tu antojo, a un mensaje</p><h1 className="font-brand text-brand-mobile font-bold md:text-brand-desktop">{step === "cart" ? "Revisa tu pedido" : "Continúa por WhatsApp"}</h1></div>
    <nav aria-label="Pasos del pedido" className="flex items-center gap-3 text-sm"><Link href="/pedido" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline" aria-current={step === "cart" ? "step" : undefined}>1. Tus platos</Link><span aria-hidden="true">→</span><Link href="/pedido/continuar" className="inline-flex min-h-12 items-center font-semibold text-brand-action underline" aria-current={step === "continue" ? "step" : undefined}>2. WhatsApp</Link></nav>
    <CartRecovery />
    <FormFeedback error={step === "continue" && cart.error ? { ...cart.error, fieldErrors: undefined } : cart.error} />
    {!catalog.configuration.orderingEnabled && <p role="status">Los pedidos por WhatsApp están pausados. Tu borrador se conserva.</p>}
    {cart.ready && !cart.draft.lines.length && <div className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-8"><p>Tu pedido está vacío. Elige productos en la carta para comenzar.</p><Link href="/#carta" className={buttonClasses("primary")}>Elegir en la carta</Link></div>}
    {!unavailable && cart.draft.lines.length > 0 && <>
      {step === "cart" ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">{cart.draft.lines.map((line) => <CartLineEditor key={line.lineId + "-" + line.observedItemRevision} line={line} item={catalog.items.find((item) => item.id === line.itemId)} />)}<CartReview /></div>
        <form method="post" onSubmit={prepare} noValidate className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-5 md:p-6 lg:sticky lg:top-6">
          <h2 className="text-product font-semibold">Resumen del pedido</h2>
          <div className="flex flex-wrap justify-between gap-2 border-b border-brand-border pb-4"><span>Subtotal de productos</span><strong className="text-xl tabular-nums text-brand-action">{formatPen(provisionalSubtotal(cart.draft.lines))}</strong></div>
          <p className="text-sm text-brand-muted">La entrega y el costo de envío se coordinan por WhatsApp.</p>
          <details><summary className="flex min-h-12 cursor-pointer items-center font-semibold text-brand-action">Añadir indicaciones generales (opcional)</summary><div className="mt-4"><CheckoutFields /></div></details>
          <SubmitButton pending={cart.validating} label="Preparar mensaje de WhatsApp" pendingLabel="Revisando pedido…" disabled={!catalog.configuration.orderingEnabled} />
          <p className="text-sm text-brand-muted">Revisaremos precios y disponibilidad. El local confirma la atención por el chat.</p>
        </form>
      </div> : <div className="mx-auto max-w-3xl space-y-6"><CartReview /><WhatsAppContinuation /></div>}
      <div className="flex flex-wrap items-start gap-4"><Link href="/#carta" className="inline-flex min-h-12 items-center text-brand-action underline">Seguir eligiendo en la carta</Link>
      {confirmNew ? <section className="space-y-3 rounded-card border border-brand-control-border p-4"><p>¿Descartar todos los productos e indicaciones de este pedido?</p><div className="flex flex-wrap gap-3"><Button onClick={() => { cart.dispatch({ type: "clearDraft" }); setConfirmNew(false); router.push("/pedido"); }}>Sí, empezar otro pedido</Button><Button variant="secondary" onClick={() => setConfirmNew(false)}>Conservar mi pedido</Button></div></section> : <Button variant="secondary" onClick={() => setConfirmNew(true)}>Empezar un nuevo pedido</Button>}
      </div>
    </>}
  </main>;
}
