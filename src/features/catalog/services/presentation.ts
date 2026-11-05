import { CATALOG_CATEGORY_PARAM, CATALOG_MEDIA_BUCKET, CATALOG_SEARCH_MAX_LENGTH, CATALOG_SEARCH_PARAM } from "../constants";
import type { Catalog, CatalogItem } from "../types/catalog";
import { formatPen } from "@/lib/money/utils";
import { normalizeSearch } from "@/lib/search/normalize";

export function productPrice(item: CatalogItem) {
  const price = orderUnitPrice(item);
  return price === null ? "Precio por confirmar" : formatPen(price);
}
export function orderUnitPrice(item: CatalogItem) {
  const prices = [...new Set(item.prices.map((price) => price.priceCents))];
  return prices.length === 1 ? prices[0] : null;
}
export function productImageUrl(item: CatalogItem, supabaseUrl: string) {
  if (!item.imagePath) return null;
  return `${supabaseUrl}/storage/v1/object/public/${CATALOG_MEDIA_BUCKET}/${item.imagePath}`;
}
export function productDescription(item: CatalogItem) {
  const content = item.inclusions.length ? ` Incluye ${item.inclusions.join(", ")}.` : "";
  return `${item.name}${item.portionLabel ? `, ${item.portionLabel}` : ""}.${content}`;
}
export function selectedCategorySlug(catalog: Catalog, requestedSlug: string) {
  return catalog.categories.find((category) => category.slug === requestedSlug)?.slug ?? "todas";
}
export function catalogSearchQuery(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, CATALOG_SEARCH_MAX_LENGTH).trim() : "";
}
export function catalogSearchTerms(query: string) {
  return normalizeSearch(query).split(/\s+/).filter(Boolean);
}
export function matchesCatalogSearch(item: CatalogItem, terms: string[]) {
  const nameAndContents = normalizeSearch([item.name, item.portionLabel, ...item.inclusions].join(" "));
  return terms.every((term) => nameAndContents.includes(term));
}
function catalogParams(categorySlug: string, search: string) {
  const params = new URLSearchParams({ [CATALOG_CATEGORY_PARAM]: categorySlug });
  if (search) params.set(CATALOG_SEARCH_PARAM, search);
  return params.toString();
}
export function catalogHref(categorySlug: string, search = "") {
  return `/?${catalogParams(categorySlug, search)}#carta`;
}
export function productHref(item: CatalogItem, categorySlug: string, search = "") {
  return `/productos/${item.slug}?${catalogParams(categorySlug, search)}`;
}
