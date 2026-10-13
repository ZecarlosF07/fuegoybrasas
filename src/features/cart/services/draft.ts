import { CART_MAX_LINES, CART_MAX_QUANTITY, CART_MAX_UNITS } from "../constants";
import type { CartAction, CartDraft, CartLine } from "../types/cart";
import { cartLineSchema, checkoutFieldsSchema } from "../validation/schemas";

export function emptyDraft(now = new Date().toISOString()): CartDraft {
  return { schemaVersion: 1, updatedAt: now, mode: null, lines: [], revision: 0, checkout: { name: "", address: "", reference: "", paymentMethodCode: "", deliveryZoneId: "", changeForCents: null, instructions: "" } };
}
export function lineKey(line: CartLine) { return JSON.stringify([line.itemId, [...line.choiceIds].sort(), line.instructions.trim()]); }
function mergeLines(lines: CartLine[], line: CartLine) {
  cartLineSchema.parse(line);
  const match = lines.find((candidate) => candidate.instructionsStatus === "ready" && line.instructionsStatus === "ready" && lineKey(candidate) === lineKey(line));
  if (!match) return [...lines, line];
  return lines.map((candidate) => candidate.lineId === match.lineId ? { ...candidate, quantity: candidate.quantity + line.quantity } : candidate);
}
export function reduceDraft(draft: CartDraft, action: CartAction, now = new Date().toISOString()): CartDraft {
  if (action.type === "hydrate") return action.draft;
  let next = draft;
  switch (action.type) {
    case "clearDraft": next = emptyDraft(now); break;
    case "setMode": next = { ...draft, mode: action.mode }; break;
    case "setCheckout": checkoutFieldsSchema.parse(action.fields); next = { ...draft, checkout: action.fields }; break;
    case "addLine":
      if (draft.lines.length && draft.mode !== action.mode) throw new Error("La modalidad es común al pedido. Cámbiala primero en el carrito y revisa los productos.");
      next = { ...draft, mode: action.mode, lines: mergeLines(draft.lines, action.line) }; break;
    case "editLine":
      next = { ...draft, lines: mergeLines(draft.lines.filter((line) => line.lineId !== action.line.lineId), action.line) }; break;
    case "setQuantity": next = { ...draft, lines: draft.lines.map((line) => line.lineId === action.lineId ? { ...line, quantity: action.quantity } : line) }; break;
    case "removeLine": next = { ...draft, lines: draft.lines.filter((line) => line.lineId !== action.lineId) }; break;
    case "acceptCatalogChanges": next = { ...draft, lines: draft.lines.map((line) => {
      const canonical = action.result.lines.find((value) => value.lineId === line.lineId);
      return canonical ? { ...line, observedItemRevision: canonical.revision, observedUnitPriceCents: canonical.unitPriceCents, displaySnapshot: { name: canonical.name, portion: canonical.portion, choices: canonical.choices } } : line;
    }) }; break;
  }
  if (new Set(next.lines.map((line) => line.lineId)).size !== next.lines.length || provisionalSubtotal(next.lines) > 2147483647 || next.lines.length > CART_MAX_LINES || next.lines.some((line) => !cartLineSchema.safeParse(line).success || line.quantity > CART_MAX_QUANTITY) || next.lines.reduce((sum, line) => sum + line.quantity, 0) > CART_MAX_UNITS) throw new Error("El pedido admite hasta 30 líneas, 20 unidades por línea y 120 unidades en total.");
  return { ...next, revision: draft.revision + 1, updatedAt: now };
}
export function draftInput(draft: CartDraft) {
  return { mode: draft.mode, paymentMethodCode: draft.checkout.paymentMethodCode, ...(draft.mode === "delivery" && draft.checkout.deliveryZoneId ? { deliveryZoneId: draft.checkout.deliveryZoneId } : {}), lines: draft.lines.map(({ lineId, itemId, quantity, choiceIds, observedItemRevision, observedUnitPriceCents }) => ({ lineId, itemId, quantity, choiceIds: [...choiceIds].sort(), observedItemRevision, observedUnitPriceCents })) };
}
export function provisionalSubtotal(lines: CartLine[]) { return lines.reduce((sum, line) => sum + line.quantity * line.observedUnitPriceCents, 0); }
