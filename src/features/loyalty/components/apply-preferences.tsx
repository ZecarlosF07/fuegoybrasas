"use client";

import { useEffect, useRef, useState } from "react";

import { cardSchema } from "../validation/dto";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { useServerWork } from "@/components/ui/hooks/use-server-work";
import { failure, success } from "@/contracts/services/result";
import { useCart } from "@/features/cart/components/cart-provider";

export function ApplyPreferences() {
  const cart = useCart();
  const current = useRef(cart);
  useEffect(() => { current.current = cart; }, [cart]);
  const work = useServerWork<string>();
  const [message, setMessage] = useState<string | null>(null);
  async function apply() {
    setMessage(null);
    const revision = current.current.draft.revision;
    const result = await work.execute(async () => {
      const response = await fetch("/api/me/card", { cache: "no-store" });
      if (!response.ok) return failure({ code: "SERVICE_UNAVAILABLE", message: "No pudimos consultar tus indicaciones. Puedes escribirlas y continuar como invitado." }, "preferences");
      const payload: unknown = await response.json();
      const parsed = cardSchema.safeParse(payload && typeof payload === "object" && "data" in payload ? payload.data : null);
      if (!parsed.success) return failure({ code: "SERVICE_UNAVAILABLE", message: "No pudimos leer tus indicaciones. Tu pedido se conserva." }, "preferences");
      const latest = current.current;
      if (latest.draft.revision !== revision || latest.blocked || latest.external || latest.expired || latest.validating) return failure({ code: "CONFLICT", message: "El borrador cambió durante la consulta. No se reemplazaron tus datos." }, "preferences");
      const accepted = latest.dispatch({ type: "setCheckout", fields: { ...latest.draft.checkout, instructions: parsed.data.frequentInstructions } });
      return accepted ? success("Se aplicaron tus indicaciones al pedido. Revísalas antes de continuar.", "preferences") : failure({ code: "CONFLICT", message: "El borrador cambió. Revísalo antes de aplicar tus indicaciones." }, "preferences");
    });
    if (result?.ok) setMessage(result.data);
  }
  return <div className="space-y-4">
    <p className="text-sm text-brand-muted">Si tienes tarjeta y sesión, puedes aplicar tus indicaciones guardadas. Esta acción reemplaza las indicaciones generales de este pedido.</p>
    <Button type="button" variant="secondary" disabled={work.pending || cart.validating || cart.blocked || cart.external || cart.expired} aria-busy={work.pending} onClick={apply}>{work.pending ? "Consultando mis indicaciones…" : "Aplicar mis indicaciones frecuentes"}</Button>
    <FormFeedback error={work.error} message={message} />
  </div>;
}
