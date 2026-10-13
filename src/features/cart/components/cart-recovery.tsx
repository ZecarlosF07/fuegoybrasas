"use client";

import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";

export function CartRecovery() {
  const cart = useCart();
  if (!cart.ready) return <p role="status">Recuperando tu borrador…</p>;
  if (!cart.warning && !cart.external && !cart.blocked && !cart.expired) return null;
  return <section aria-label="Recuperación del borrador" className="space-y-3 rounded-card border border-brand-control-border bg-brand-surface p-4">
    <p role="status">{cart.warning}</p>
    {cart.external && <Button variant="secondary" onClick={cart.loadExternal}>Cargar versión de la otra pestaña</Button>}
    {cart.expired && <Button variant="secondary" onClick={() => cart.resolveRecovery(false)}>Conservar y revisar este borrador</Button>}
    {(cart.blocked || cart.expired || cart.external) && <Button onClick={() => cart.resolveRecovery(true)}>Descartar borrador y empezar otro</Button>}
  </section>;
}
