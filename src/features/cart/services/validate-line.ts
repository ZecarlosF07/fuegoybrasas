import type { CartInput, ValidatedCart } from "../types/cart";
import type { ErrorCode } from "@/contracts/types/result";
import { orderUnitPrice } from "@/features/catalog/services/presentation";
import type { CatalogItem } from "@/features/catalog/types/catalog";

export function validateLine(line: CartInput["lines"][number], item: CatalogItem | undefined) {
  const issue = (code: ErrorCode, message: string) => ({ lineId: line.lineId, code, message });
  if (!item) return { issues: [issue("ITEM_UNAVAILABLE", "El producto ya no está en la carta. Retíralo o vuelve a elegirlo.")], canonical: null };
  const price = orderUnitPrice(item);
  if (price === null) return { issues: [issue("CATALOG_CHANGED", `${item.name} necesita confirmar su precio con el local. No aplicamos un importe automáticamente.`)], canonical: null };
  const issues: ValidatedCart["lineIssues"] = [];
  if (item.availability !== "available") issues.push(issue("ITEM_UNAVAILABLE", `${item.name} está agotado.`));
  const choices = item.optionGroups.flatMap((group) => group.choices).filter((choice) => line.choiceIds.includes(choice.id));
  if (choices.length !== line.choiceIds.length) issues.push(issue("OPTION_UNAVAILABLE", `Revisa las opciones retiradas de ${item.name}.`));
  for (const group of item.optionGroups) {
    const count = group.choices.filter((choice) => line.choiceIds.includes(choice.id)).length;
    if (count < group.minChoices || count > group.maxChoices) issues.push(issue("VALIDATION_ERROR", `${group.name}: elige entre ${group.minChoices} y ${group.maxChoices} opciones.`));
  }
  const unitPriceCents = price + choices.reduce((sum, choice) => sum + choice.extraPriceCents, 0);
  if (item.revision !== line.observedItemRevision || unitPriceCents !== line.observedUnitPriceCents) issues.push(issue("CATALOG_CHANGED", `Cambió la carta de ${item.name}. Revisa el precio y acepta la versión actual.`));
  const canonical = { lineId: line.lineId, itemId: item.id, name: item.name, portion: item.portionLabel ?? "", quantity: line.quantity, choiceIds: line.choiceIds, choices: choices.map((choice) => choice.label), revision: item.revision, unitPriceCents, lineTotalCents: unitPriceCents * line.quantity };
  return { issues, canonical };
}
