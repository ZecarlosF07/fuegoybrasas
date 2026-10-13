import type { AdminCatalog, AdminRow, CatalogEntityType, EntitySelection } from "../types/catalog-admin";

export function entityRows(catalog: AdminCatalog, type: CatalogEntityType): AdminRow[] {
  const rows = { category: catalog.categories, catalog_item: catalog.items, catalog_price: catalog.prices, promotion: catalog.promotions, option_group: catalog.groups, option_choice: catalog.choices };
  return rows[type];
}
export function selectEntity(type: CatalogEntityType, row: AdminRow): EntitySelection {
  const entityId = type === "promotion" ? row.item_id : row.id;
  if (!entityId) throw new Error("El registro no tiene una identidad válida.");
  return { entityType: type, entityId, row };
}
export function selectionItem(selection: EntitySelection | null, catalog: AdminCatalog) {
  if (!selection) return null;
  if (selection.entityType === "catalog_item") return selection.creating ? null : selection.entityId;
  if (selection.entityType === "option_choice") return catalog.groups.find((group) => group.id === selection.row.group_id)?.item_id ?? null;
  return typeof selection.row.item_id === "string" ? selection.row.item_id : null;
}
