import type { CatalogCategoryVisual } from "./types/media";

export const CATALOG_HERO_IMAGE = "/images/menu/pollo-promocion.webp";

export const CATALOG_REFERENCE_IMAGES: Readonly<Record<string, string>> = {
  "alitas-acevichadas": "alitas-acevichadas",
  "alitas-clasicas": "alitas-clasicas",
  "alitas-dulces": "alitas-dulces",
  "alitas-maracuya": "alitas-maracuya",
  "alitas-picantes": "alitas-picantes",
  "combo-mostrito": "combo-mostrito",
  "cuarto-pollo-para-llevar": "pollo-cuarto",
  "gran-promocion": "gran-promocion",
  "medio-pollo-a-la-brasa": "pollo-medio",
  "mostrito-cuarto-pollo": "mostrito-cuarto",
  "mostrito-medio-pollo": "mostrito-medio",
  "mostrito-octavo-pollo": "mostrito-octavo",
  "mostrito-pollo-entero": "mostrito-entero",
  "pollo-entero-a-la-brasa": "pollo-entero",
  "promo-mostrito": "mostrito-octavo",
  "promo-pollo-entero": "pollo-promocion",
  "ronda-alitas": "ronda-alitas",
};

export const CATALOG_CATEGORY_VISUALS: readonly CatalogCategoryVisual[] = [
  { slug: "pollo-a-la-brasa", label: "Pollo a la brasa", description: "El clásico que nos reúne", src: CATALOG_HERO_IMAGE },
  { slug: "mostritos", label: "Mostritos", description: "Pollo, chaufa y papas", src: "/images/menu/mostrito-octavo.webp" },
  { slug: "alitas", label: "Alitas", description: "Encuentra tu salsa favorita", src: "/images/menu/alitas-clasicas.webp" },
];
