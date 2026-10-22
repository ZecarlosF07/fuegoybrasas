import { VALIDATION_TTL_MS, MODE_LABELS, WHATSAPP_MAX_URL_LENGTH } from "../constants";
import type { CartDraft, ValidatedCart } from "../types/cart";
import { checkoutFormSchema } from "../validation/schemas";
import { formatPen } from "@/lib/money/utils";

export function prepareMessage(cart: ValidatedCart, draft: CartDraft) {
  if (cart.status !== "ready") throw new Error("Revisa los cambios antes de preparar el mensaje.");
  const fields = checkoutFormSchema.parse({ ...draft.checkout, mode: cart.mode });
  if (draft.lines.some((line) => line.instructionsStatus !== "ready")) throw new Error("Revisa las indicaciones de los productos.");
  const lines = cart.lines.flatMap((line) => {
    const local = draft.lines.find((value) => value.lineId === line.lineId);
    if (!local) throw new Error("El borrador cambió. Vuelve a validarlo.");
    return [`${line.quantity} × ${line.name}${line.portion ? ` — ${line.portion}` : ""}: ${formatPen(line.unitPriceCents)} c/u · ${formatPen(line.lineTotalCents)}`, ...(line.choices.length ? [`Opciones: ${line.choices.join(", ")}`] : []), ...(local.instructions ? [`Indicaciones: ${local.instructions}`] : [])];
  });
  const message = ["Hola, Fuego y Brasas. Quisiera coordinar este pedido:", `Nombre: ${fields.name}`, `Modalidad: ${MODE_LABELS[cart.mode]}`, "", ...lines, "", `Subtotal de productos: ${formatPen(cart.totals.subtotalCents)}`, `Cargo: ${cart.totals.charge.amountCents === null ? "por confirmar" : formatPen(cart.totals.charge.amountCents)}`, `Total: ${cart.totals.totalCents === null ? "por confirmar" : formatPen(cart.totals.totalCents)}`, ...(cart.mode === "delivery" ? [`Dirección: ${fields.address}`, ...(fields.reference ? [`Referencia: ${fields.reference}`] : []), `Zona: ${cart.deliveryZone?.name ?? "por coordinar"}`] : []), ...(fields.instructions ? [`Indicaciones generales: ${fields.instructions}`] : []), ...cart.warnings, "Solicito confirmación de disponibilidad y condiciones por este chat."].join("\n");
  const chatUrl = `https://wa.me/${cart.whatsappE164.slice(1)}`;
  const encodedUrl = `${chatUrl}?text=${encodeURIComponent(message)}`;
  return { message, url: encodedUrl.length <= WHATSAPP_MAX_URL_LENGTH ? encodedUrl : chatUrl, long: encodedUrl.length > WHATSAPP_MAX_URL_LENGTH };
}
export function validationDeadline(startedAt: number, cart: ValidatedCart) { return startedAt + Math.max(0, Math.min(VALIDATION_TTL_MS, Date.parse(cart.expiresAt) - Date.parse(cart.validatedAt))); }
