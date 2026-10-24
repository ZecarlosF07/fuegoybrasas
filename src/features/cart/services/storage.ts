import { CART_KEY, CART_MAX_IDLE_MS, CHECKOUT_KEY } from "../constants";
import { emptyDraft } from "./draft";
import type { CartDraft, CartRecovery } from "../types/cart";
import { storedCartSchema, storedCheckoutSchema } from "../validation/schemas";

export function recoverDraft(commercial: string | null, personal: string | null, now = Date.now(), external = false): CartRecovery {
  const empty = emptyDraft(new Date(now).toISOString());
  try {
    const cart = commercial ? storedCartSchema.parse(JSON.parse(commercial)) : null;
    const checkout = personal ? storedCheckoutSchema.parse(JSON.parse(personal)) : null;
    if (!cart) return { draft: empty, warning: null, blocked: false, expired: false };
    const lines = cart.lines.map(({ hadInstructions, ...line }) => {
      const instructions = external ? "" : checkout?.lineInstructions[line.lineId] ?? "";
      return { ...line, instructions, instructionsStatus: hadInstructions && !instructions ? "needs_review" : "ready" };
    });
    const draft: CartDraft = { ...empty, updatedAt: cart.updatedAt, checkout: checkout?.fields ?? empty.checkout, lines: lines.map((line) => ({ ...line, instructionsStatus: line.instructionsStatus === "ready" ? "ready" : "needs_review" })) };
    const expired = now - Date.parse(cart.updatedAt) > CART_MAX_IDLE_MS || Date.parse(cart.updatedAt) > now + CART_MAX_IDLE_MS;
    return { draft, warning: expired ? "Este borrador lleva más de siete días sin actualizarse. Decide si quieres revisarlo o empezar otro." : lines.some((line) => line.instructionsStatus === "needs_review") ? "Revisa las indicaciones que no se pudieron recuperar." : null, blocked: false, expired };
  } catch { return { draft: empty, warning: "Hay un borrador incompatible o dañado. Lo conservamos sin sobrescribirlo. Para continuar debes autorizar empezar otro.", blocked: true, expired: false }; }
}
export function readDraft(external = false): CartRecovery {
  let commercial: string | null = null;
  let personal: string | null = null;
  const warnings: string[] = [];
  try { commercial = localStorage.getItem(CART_KEY); }
  catch { warnings.push("No pudimos leer los productos guardados en este dispositivo."); }
  try { personal = sessionStorage.getItem(CHECKOUT_KEY); }
  catch { warnings.push("No pudimos leer los datos de esta pestaña."); }
  const recovered = recoverDraft(commercial, personal, Date.now(), external);
  if (!warnings.length) return recovered;
  return { ...recovered, warning: [...warnings, recovered.warning, "Puedes seguir en memoria; al cerrar podrías perder el pedido."].filter(Boolean).join(" ") };
}
export function serializeDraft(draft: CartDraft, writerId: string) {
  const cart = { schemaVersion: 1, updatedAt: draft.updatedAt, writerId, lines: draft.lines.map(({ instructions, instructionsStatus, ...line }) => ({ ...line, hadInstructions: Boolean(instructions) || instructionsStatus === "needs_review" })) };
  const checkout = { schemaVersion: 1, fields: draft.checkout, lineInstructions: Object.fromEntries(draft.lines.filter((line) => line.instructionsStatus === "ready").map((line) => [line.lineId, line.instructions])) };
  return { commercial: JSON.stringify(storedCartSchema.parse(cart)), personal: JSON.stringify(storedCheckoutSchema.parse(checkout)) };
}
export function writeDraft(draft: CartDraft, writerId: string) {
  const stored = serializeDraft(draft, writerId);
  const errors: string[] = [];
  try { localStorage.setItem(CART_KEY, stored.commercial); } catch { errors.push("No pudimos guardar los productos en este dispositivo."); }
  try { sessionStorage.setItem(CHECKOUT_KEY, stored.personal); } catch { errors.push("No pudimos guardar los datos de esta pestaña."); }
  return errors.length ? `${errors.join(" ")} Conservamos el pedido en memoria mientras esta pantalla siga abierta.` : null;
}
