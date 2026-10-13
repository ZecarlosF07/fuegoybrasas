"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { MODE_LABELS } from "../constants";
import { CartLineEditor } from "./cart-line";
import { useCart } from "./cart-provider";
import { CartRecovery } from "./cart-recovery";
import { CartReview } from "./cart-review";
import { CheckoutFields } from "./checkout-fields";
import { WhatsAppContinuation } from "./whatsapp-continuation";
import { provisionalSubtotal } from "../services/draft";
import type { CartPageProps } from "../types/cart";
import { modeSchema } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatPen, parseSolesToCents } from "@/lib/money/utils";

const HEADINGS = { cart: "Revisa tu pedido", data: "Completa tus datos", continue: "Continúa por WhatsApp" };
export function CartFlow({ catalog, step }: CartPageProps) {
  const cart = useCart();
  const router = useRouter();
  const [confirmNew, setConfirmNew] = useState(false);
  const unavailable = !cart.ready || cart.blocked || cart.expired || cart.external;
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const change = new FormData(event.currentTarget).get("changeForCents");
    try {
      const amount = typeof change === "string" ? change.trim() ? parseSolesToCents(change.trim()) : null : cart.draft.checkout.changeForCents;
      const saved = cart.dispatch({ type: "setCheckout", fields: { ...cart.draft.checkout, changeForCents: amount } });
      if (!saved) return;
    } catch { cart.setError({ code: "VALIDATION_ERROR", message: "Revisa el importe para el cambio.", fieldErrors: { changeForCents: ["Usa soles con hasta dos decimales."] } }); return; }
    if (await cart.validate()) router.push("/pedido/continuar");
  }
  return <main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl space-y-6 px-4 py-8 focus:outline-none md:px-6">
    <h1 className="font-brand text-brand-mobile font-bold md:text-brand-desktop">{HEADINGS[step]}</h1>
    <nav aria-label="Pasos del pedido" className="flex flex-wrap gap-4">{[["/pedido", "Productos"], ["/pedido/datos", "Datos"], ["/pedido/continuar", "WhatsApp"]].map(([href, label]) => <Link href={href} key={href} className="inline-flex min-h-12 items-center text-brand-action underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action" aria-current={href === `/pedido${step === "cart" ? "" : step === "data" ? "/datos" : "/continuar"}` ? "step" : undefined}>{label}</Link>)}</nav>
    <CartRecovery />
    <FormFeedback error={step === "continue" && cart.error ? { ...cart.error, fieldErrors: undefined } : cart.error} />
    {!catalog.configuration.orderingEnabled && <p role="status">Los pedidos por WhatsApp están pausados. Tu borrador se conserva.</p>}
    {cart.ready && !cart.draft.lines.length && <div className="space-y-4"><p>Tu pedido está vacío. Elige productos en la carta para comenzar.</p><Link href="/#carta" className={buttonClasses("primary")}>Elegir en la carta</Link></div>}
    {!unavailable && cart.draft.lines.length > 0 && <>
      {step !== "continue" && <SelectField id="mode" label="Modalidad del pedido" value={cart.draft.mode ?? ""} disabled={cart.validating} onChange={(event) => cart.dispatch({ type: "setMode", mode: modeSchema.parse(event.target.value) })}><option value="" disabled>Elige modalidad</option><option value="delivery">{MODE_LABELS.delivery}</option>{catalog.configuration.locationVerified && catalog.configuration.address && <option value="pickup">{MODE_LABELS.pickup}</option>}{cart.draft.mode === "pickup" && !catalog.configuration.locationVerified && <option value="pickup" disabled>Recojo: ubicación pendiente</option>}</SelectField>}
      {step === "cart" && <>
        {cart.draft.lines.map((line) => <CartLineEditor key={`${line.lineId}-${line.observedItemRevision}`} line={line} item={catalog.items.find((item) => item.id === line.itemId)} />)}
        <p className="text-xl font-semibold">Subtotal provisional: {formatPen(provisionalSubtotal(cart.draft.lines))}</p><p className="text-brand-muted">Revisaremos los precios, opciones y cargos antes de preparar el mensaje.</p>
        <Link href="/pedido/datos" className={buttonClasses("primary")}>Continuar con mis datos</Link>
      </>}
      <CartReview />
      {step === "data" && <form method="post" onSubmit={prepare} noValidate className="space-y-6 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6"><CheckoutFields catalog={catalog} /><p className="text-sm text-brand-muted">Tus datos se conservan en esta pestaña y solo se incluyen en el mensaje que abres en WhatsApp.</p><SubmitButton pending={cart.validating} label="Preparar mensaje de WhatsApp" pendingLabel="Revisando pedido…" disabled={!catalog.configuration.orderingEnabled} /></form>}
      {step === "continue" && <WhatsAppContinuation />}
      <div className="flex flex-wrap items-start gap-4"><Link href="/#carta" className="inline-flex min-h-12 items-center text-brand-action underline">Seguir eligiendo en la carta</Link>
      {confirmNew ? <section className="space-y-3 rounded-card border border-brand-control-border p-4"><p>¿Descartar todos los productos y datos de este pedido?</p><div className="flex flex-wrap gap-3"><Button onClick={() => { cart.dispatch({ type: "clearDraft" }); setConfirmNew(false); router.push("/pedido"); }}>Sí, empezar otro pedido</Button><Button variant="secondary" onClick={() => setConfirmNew(false)}>Conservar mi pedido</Button></div></section> : <Button variant="secondary" onClick={() => setConfirmNew(true)}>Empezar un nuevo pedido</Button>}
      </div>
    </>}
  </main>;
}
