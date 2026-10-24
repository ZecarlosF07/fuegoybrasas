import type { CartLine } from "../types/cart";
import { orderUnitPrice } from "@/features/catalog/services/presentation";
import type { CatalogItem } from "@/features/catalog/types/catalog";

export function purchaseLine(item: CatalogItem, form: FormData, lineId: string): CartLine {
  const choiceIds = form.getAll("choiceIds").filter((value): value is string => typeof value === "string").sort();
  const allChoices = item.optionGroups.flatMap((group) => group.choices);
  const choices = allChoices.filter((choice) => choiceIds.includes(choice.id));
  if (choices.length !== choiceIds.length) throw new Error("Elige únicamente las opciones vigentes del producto.");
  const price = orderUnitPrice(item);
  if (price === null || item.availability !== "available") throw new Error("Este producto necesita confirmar su precio o disponibilidad con el local.");
  for (const group of item.optionGroups) {
    const count = group.choices.filter((choice) => choiceIds.includes(choice.id)).length;
    if (count < group.minChoices || count > group.maxChoices) throw new Error(`${group.name}: elige entre ${group.minChoices} y ${group.maxChoices} opciones.`);
  }
  return { lineId, itemId: item.id, quantity: Number(form.get("quantity")), choiceIds, observedItemRevision: item.revision, observedUnitPriceCents: price + choices.reduce((sum, choice) => sum + choice.extraPriceCents, 0), instructions: String(form.get("instructions") ?? "").trim(), instructionsStatus: "ready", displaySnapshot: { name: item.name, portion: item.portionLabel ?? "", choices: choices.map((choice) => choice.label) } };
}
