"use client";

import Link from "next/link";

import { useCart } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { formatPen } from "@/lib/money/utils";

export function CartReview() {
  const cart = useCart();
  const result = cart.validated;
  if (!result) return null;
  return <section aria-label="Resultado de la revisión" className="space-y-3 rounded-card border border-brand-control-border bg-brand-surface p-4">
    <h2 className="text-product font-semibold">{result.status === "ready" ? "Importes revisados" : "Revisa los cambios antes de continuar"}</h2>
    {result.lines.map((line) => <p key={line.lineId}>{line.quantity} × {line.name}: {formatPen(line.lineTotalCents)}</p>)}
    {result.lineIssues.length > 0 && <ul className="list-inside list-disc" role="alert">{result.lineIssues.map((issue, index) => <li key={`${issue.lineId}-${index}`}>{issue.message}</li>)}</ul>}
    <p>Subtotal de productos: <strong>{formatPen(result.totals.subtotalCents)}</strong></p>
    <p>Cargo: {result.totals.charge.amountCents === null ? "por confirmar" : formatPen(result.totals.charge.amountCents)}</p>
    <p>Total: <strong>{result.totals.totalCents === null ? "pendiente de confirmar por WhatsApp" : formatPen(result.totals.totalCents)}</strong></p>
    {result.warnings.length > 0 && <ul className="list-inside list-disc text-brand-muted">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
    {result.status === "needs_review" && <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => cart.dispatch({ type: "acceptCatalogChanges", result })} disabled={cart.validating}>Aceptar precios y versiones actuales</Button><Link href="/pedido" className="inline-flex min-h-12 items-center underline">Corregir productos y opciones</Link></div>}
    {result.status === "needs_review" && <p className="text-sm">Aceptar precios conserva los productos y opciones elegidos. Debes corregir los agotados o incompatibles y volver a validar.</p>}
  </section>;
}
