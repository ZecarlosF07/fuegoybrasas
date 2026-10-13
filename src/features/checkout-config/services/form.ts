import type { CheckoutEntityType } from "../types/config";
import { parseSolesToCents } from "@/lib/money/utils";

function optionalMoney(form: FormData, name: string) { const value = String(form.get(name) ?? "").trim(); return value ? parseSolesToCents(value) : null; }
export function checkoutFormPatch(entity: CheckoutEntityType, form: FormData) {
  const common = { enabled: form.has("enabled"), verified: form.has("verified") };
  if (entity === "payment_method") return { ...common, code: String(form.get("code") ?? "").trim(), label: String(form.get("label") ?? "").trim(), instructions: String(form.get("instructions") ?? "").trim() || null, needs_change: form.has("needs_change"), sort_order: Number(form.get("sort_order")) };
  return { ...common, name: String(form.get("name") ?? "").trim(), coverage: String(form.get("coverage") ?? ""), fee_cents: optionalMoney(form, "fee_cents"), minimum_subtotal_cents: optionalMoney(form, "minimum_subtotal_cents") };
}
