import { CATALOG_CATEGORY_PARAM, CATALOG_MEDIA_BUCKET } from "../constants";
import type { Catalog, CatalogItem } from "../types/catalog";
import { formatPen } from "@/lib/money/utils";

export function productPrice(item: CatalogItem) {
  const prices = item.prices.map((price) => price.priceCents);
  const minimum = Math.min(...prices);
  return `${Math.max(...prices) > minimum ? "Desde " : ""}${formatPen(minimum)}`;
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
export function catalogHref(categorySlug: string) {
  return `/?${CATALOG_CATEGORY_PARAM}=${encodeURIComponent(categorySlug)}#carta`;
}
export function productHref(item: CatalogItem, categorySlug: string) {
  return `/productos/${item.slug}?${CATALOG_CATEGORY_PARAM}=${encodeURIComponent(categorySlug)}`;
}
