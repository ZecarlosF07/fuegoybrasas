import { VALIDATION_TTL_MS, WHATSAPP_MAX_URL_LENGTH } from "../constants";
import type { CartDraft, ValidatedCart } from "../types/cart";
import { checkoutFormSchema } from "../validation/schemas";
import { formatPen } from "@/lib/money/utils";

export function prepareMessage(cart: ValidatedCart, draft: CartDraft) {
  if (cart.status !== "ready") throw new Error("Revisa los cambios antes de preparar el mensaje.");
  const fields = checkoutFormSchema.parse(draft.checkout);
  if (draft.lines.some((line) => line.instructionsStatus !== "ready")) throw new Error("Revisa las indicaciones de los productos.");
  const lines = cart.lines.flatMap((line) => {
    const local = draft.lines.find((value) => value.lineId === line.lineId);
    if (!local) throw new Error("El borrador cambió. Vuelve a validarlo.");
    return [`${line.quantity} × ${line.name}${line.portion ? ` — ${line.portion}` : ""}: ${formatPen(line.unitPriceCents)} c/u · ${formatPen(line.lineTotalCents)}`, ...(line.choices.length ? [`Opciones: ${line.choices.join(", ")}`] : []), ...(local.instructions ? [`Indicaciones: ${local.instructions}`] : [])];
  });
  const message = ["Hola, Fuego y Brasas. Quisiera pedir:", "", ...lines, "", `Subtotal de productos: ${formatPen(cart.totals.subtotalCents)}`, ...(fields.instructions ? [`Indicaciones generales: ${fields.instructions}`] : []), "", "Coordinamos la entrega y el costo de envío por este chat."].join("\n");
  const chatUrl = `https://wa.me/${cart.whatsappE164.slice(1)}`;
  const encodedUrl = `${chatUrl}?text=${encodeURIComponent(message)}`;
  return { message, url: encodedUrl.length <= WHATSAPP_MAX_URL_LENGTH ? encodedUrl : chatUrl, long: encodedUrl.length > WHATSAPP_MAX_URL_LENGTH };
}
export function validationDeadline(startedAt: number, cart: ValidatedCart) { return startedAt + Math.max(0, Math.min(VALIDATION_TTL_MS, Date.parse(cart.expiresAt) - Date.parse(cart.validatedAt))); }
