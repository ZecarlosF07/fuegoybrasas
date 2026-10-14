import { describe, expect, it } from "vitest";

import { resolveCatalogMedia, visibleCategoryItems, visibleCategoryVisuals } from "./media";
import { catalogFixture } from "../tests/fixtures";

describe("Imágenes referenciales y carta publicada", () => {
  const item = catalogFixture.items[0];
  const supabaseUrl = "https://example.supabase.co";

  it("prioriza la foto asociada desde el panel y no la etiqueta como generada", () => {
    const imagePath = `items/${item.id}/33333333-3333-4333-8333-000000000001.webp`;
    expect(resolveCatalogMedia({ ...item, imagePath }, supabaseUrl)).toEqual({
      src: `${supabaseUrl}/storage/v1/object/public/catalog-media/${imagePath}`,
      alt: `${item.name}, ${item.portionLabel}`,
      referential: false,
    });
  });

  it("identifica como referencial la imagen de apoyo y conserva la porción en el texto alternativo", () => {
    expect(resolveCatalogMedia(item, supabaseUrl)).toEqual({
      src: "/images/menu/gran-promocion.webp",
      alt: `Imagen referencial de ${item.name}, ${item.portionLabel}`,
      referential: true,
    });
  });

  it("no inventa fotografías por nombre ni utiliza claves heredadas del objeto", () => {
    for (const slug of ["nuevo-mostrito", "cuarto-pollo-mesa", "constructor"]) {
      expect(resolveCatalogMedia({ ...item, slug, name: "Mostrito" }, supabaseUrl)).toBeNull();
    }
  });

  it("no agrega categorías ni platos cuando no están en la carta recibida", () => {
    const category = { ...catalogFixture.categories[0], slug: "mostritos", name: "Mostritos" };
    const emptyCategory = { ...category, id: "11111111-1111-4111-8111-000000000002", slug: "pollo-a-la-brasa" };
    const catalog = { ...catalogFixture, categories: [category, emptyCategory] };
    const highlights = visibleCategoryVisuals(catalog);
    const sections = visibleCategoryItems(catalog, "todas");
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.slug).toBe("mostritos");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.category.slug).toBe("mostritos");
    expect(visibleCategoryItems(catalog, "pollo-a-la-brasa")).toEqual([]);
  });
});
