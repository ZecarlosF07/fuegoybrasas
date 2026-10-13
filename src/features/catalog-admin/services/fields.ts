import { PROMOTION_LOCAL_OFFSET } from "../constants";
import type { AdminRow, CatalogEntityType, FieldDefinition } from "../types/catalog-admin";
import { parseSolesToCents } from "@/lib/money/utils";

const confirmed: FieldDefinition = { name: "verified", label: "Confirmado por el negocio", kind: "boolean" };
const order: FieldDefinition = { name: "sort_order", label: "Orden de presentación", kind: "number" };
const name: FieldDefinition = { name: "name", label: "Nombre" };
const slug: FieldDefinition = { name: "slug", label: "Identificador de la URL", help: "Letras minúsculas, números y guiones. Cambiarlo cambia el enlace del producto." };
export const ENTITY_FIELDS: Record<CatalogEntityType, FieldDefinition[]> = {
  category: [name, slug, order, { name: "active", label: "Categoría activa", kind: "boolean" }],
  catalog_item: [name, slug, { name: "kind", label: "Tipo", kind: "select", options: [{ value: "regular", label: "Plato de carta" }, { value: "promotion", label: "Promoción" }] }, { name: "portion_label", label: "Porción" }, { name: "inclusions", label: "Incluye", kind: "textarea", help: "Una inclusión por línea. No copiar las de otra promoción." }, { name: "description", label: "Descripción", kind: "textarea" }, order, { name: "availability", label: "Disponibilidad", kind: "select", options: [{ value: "available", label: "Disponible" }, { value: "sold_out", label: "Agotado" }] }, { name: "content_verified", label: "Confirmo la porción y las inclusiones", kind: "boolean", help: "La confirmación se solicita nuevamente si editas el contenido." }, { name: "online_enabled", label: "Habilitado para la web", kind: "boolean" }, { name: "publication_status", label: "Estado de publicación", kind: "select", options: [{ value: "draft", label: "Borrador" }, { value: "published", label: "Publicado" }, { value: "archived", label: "Archivado" }] }],
  catalog_price: [{ name: "price_cents", label: "Precio en soles", kind: "money", help: "Precio por esta modalidad. El precio fuente no lo confirma." }, confirmed],
  promotion: [{ name: "enabled", label: "Promoción habilitada", kind: "boolean" }, { name: "starts_at", label: "Fecha y hora de inicio", kind: "datetime", help: "Horario de Lima. Vacío: sin límite conocido." }, { name: "ends_at", label: "Fecha y hora de fin", kind: "datetime", help: "Horario de Lima. La promoción termina en este momento." }, { name: "weekdays", label: "Días de la semana", kind: "weekdays", help: "Si no eliges días, se aplica todos los días. Horario de Lima." }, { name: "previous_price_cents", label: "Precio anterior en soles", kind: "money" }, { name: "comparison_verified", label: "Confirmo la comparación de precio y contenido", kind: "boolean" }],
  option_group: [name, { name: "min_choices", label: "Elecciones mínimas", kind: "number" }, { name: "max_choices", label: "Elecciones máximas", kind: "number" }, order, { name: "active", label: "Grupo activo", kind: "boolean" }, confirmed],
  option_choice: [{ name: "label", label: "Nombre de la opción" }, { name: "extra_price_cents", label: "Recargo en soles", kind: "money" }, order, { name: "available", label: "Opción disponible", kind: "boolean" }, confirmed],
};
export function fieldValue(field: FieldDefinition, row: AdminRow) {
  const value = row[field.name];
  if (value === null || value === undefined) return "";
  if (field.kind === "money" && typeof value === "number") return (value / 100).toFixed(2);
  if (field.kind === "datetime" && typeof value === "string") return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(value)).replace(" ", "T");
  if (Array.isArray(value)) return value.join(field.kind === "weekdays" ? "," : "\n");
  return String(value);
}
function parseField(field: FieldDefinition, form: FormData): unknown {
  const raw = String(form.get(field.name) ?? "").trim();
  if (field.kind === "boolean") return form.has(field.name);
  if (field.kind === "money") return raw ? parseSolesToCents(raw.replace(",", ".")) : null;
  if (field.kind === "number") return raw ? Number(raw) : Number.NaN;
  if (field.name === "inclusions") return raw ? raw.split(/\r?\n/).map((line) => line.trim()) : [];
  if (field.kind === "weekdays") return form.getAll(field.name).length ? form.getAll(field.name).map(Number) : null;
  if (field.kind === "datetime") return raw ? new Date(`${raw}${PROMOTION_LOCAL_OFFSET}`).toISOString() : null;
  if (["portion_label", "description", "starts_at", "ends_at"].includes(field.name)) return raw || null;
  return raw;
}
export function entityFormPatch(type: CatalogEntityType, form: FormData, row: AdminRow, creating = false) {
  const values = Object.fromEntries(ENTITY_FIELDS[type].map((field) => [field.name, parseField(field, form)]));
  const patch = creating ? values : Object.fromEntries(Object.entries(values).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(row[key])));
  if (type === "catalog_item" && form.has("content_verified")) patch.content_verified = true;
  if (["catalog_price", "option_group", "option_choice"].includes(type) && form.has("verified")) patch.verified = true;
  if (creating && type === "catalog_item") { patch.category_id = form.get("category_id"); patch.image_path = null; }
  if (creating && type === "catalog_price") { patch.item_id = row.item_id; patch.mode = form.get("mode"); }
  if (creating && type === "option_group") patch.item_id = row.item_id;
  if (creating && type === "option_choice") patch.group_id = row.group_id;
  return patch;
}
export function newEntityRow(type: CatalogEntityType, parentId?: string): AdminRow {
  const common = { revision: 0, deleted_at: null, sort_order: 0 };
  if (type === "category") return { ...common, name: "", slug: "", active: false };
  if (type === "catalog_item") return { ...common, name: "", slug: "", category_id: parentId, kind: "regular", portion_label: null, description: null, inclusions: [], image_path: null, online_enabled: false, content_verified: false, publication_status: "draft", availability: "available" };
  if (type === "catalog_price") return { ...common, item_id: parentId, price_cents: null, verified: false, mode: "delivery" };
  if (type === "promotion") return { ...common, item_id: parentId, enabled: false, starts_at: null, ends_at: null, weekdays: null, previous_price_cents: null, comparison_verified: false };
  if (type === "option_group") return { ...common, item_id: parentId, name: "", min_choices: 0, max_choices: 1, active: false, verified: false };
  return { ...common, group_id: parentId, label: "", extra_price_cents: 0, available: false, verified: false };
}
