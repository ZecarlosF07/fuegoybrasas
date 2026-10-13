import type { AdminCatalog, AdminRow } from "../types/catalog-admin";

export function publicationIssues(row: AdminRow, catalog: AdminCatalog) {
  const issues: string[] = [];
  const category = catalog.categories.find((entry) => entry.id === row.category_id);
  if (!category || category.deleted_at || !category.active) issues.push("Activa una categoría vigente.");
  if (!row.portion_label || !row.content_verified) issues.push("Confirma la porción y las inclusiones del producto.");
  if (!row.online_enabled) issues.push("Habilita el producto para la web.");
  if (!catalog.prices.some((price) => price.item_id === row.id && !price.deleted_at && price.verified && price.mode !== "dine_in")) issues.push("Guarda al menos un precio online confirmado para entrega o recojo.");
  if (row.kind === "promotion" && !catalog.promotions.some((promotion) => promotion.item_id === row.id && !promotion.deleted_at)) issues.push("Completa el registro de promoción y revisa su vigencia.");
  if (row.source_ref === "C01") issues.push("El precio de mesa C01 no se publica en la web.");
  const incomplete = catalog.groups.filter((group) => group.item_id === row.id && group.active && !group.deleted_at && group.min_choices > 0)
    .some((group) => !group.verified || catalog.choices.filter((choice) => choice.group_id === group.id && !choice.deleted_at && choice.available && choice.verified).length < group.min_choices);
  if (incomplete) issues.push("Completa las opciones obligatorias antes de publicar o desactivar una opción.");
  return issues;
}
