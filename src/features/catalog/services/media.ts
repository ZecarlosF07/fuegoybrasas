import { CATALOG_CATEGORY_VISUALS, CATALOG_REFERENCE_IMAGES } from "../media";
import { productImageUrl } from "./presentation";
import type { Catalog, CatalogItem } from "../types/catalog";
import type { CatalogMedia } from "../types/media";

export function resolveCatalogMedia(item: CatalogItem, supabaseUrl: string): CatalogMedia | null {
  const description = `${item.name}${item.portionLabel ? `, ${item.portionLabel}` : ""}`;
  const uploadedImage = productImageUrl(item, supabaseUrl);
  if (uploadedImage) return { src: uploadedImage, alt: description, referential: false };

  const referenceImage = Object.hasOwn(CATALOG_REFERENCE_IMAGES, item.slug) ? CATALOG_REFERENCE_IMAGES[item.slug] : undefined;
  if (!referenceImage) return null;
  return { src: `/images/menu/${referenceImage}.webp`, alt: `Imagen referencial de ${description}`, referential: true };
}

export function visibleCategoryVisuals(catalog: Catalog) {
  return CATALOG_CATEGORY_VISUALS.filter((visual) => {
    const category = catalog.categories.find((entry) => entry.slug === visual.slug);
    return category && catalog.items.some((item) => item.categoryId === category.id);
  });
}

export function visibleCategoryItems(catalog: Catalog, selectedSlug: string) {
  const categories = selectedSlug === "todas" ? catalog.categories : catalog.categories.filter((category) => category.slug === selectedSlug);
  return categories.map((category) => ({ category, items: catalog.items.filter((item) => item.categoryId === category.id) }))
    .filter((section) => section.items.length > 0);
}
