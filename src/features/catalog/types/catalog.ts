import type { ReactNode } from "react";
import type { z } from "zod";

import type { catalogConfigSchema, catalogItemSchema, catalogSchema } from "../validation/schemas";

export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CatalogConfiguration = z.infer<typeof catalogConfigSchema>;
export type CatalogCategory = Catalog["categories"][number];
export type BusinessStatus = "open" | "closed" | "unknown";
export type CatalogProps = { catalog: Catalog };
export type CatalogShellProps = { children: ReactNode; showCartDock?: boolean };
export type CatalogViewProps = CatalogProps & { selectedSlug?: string };
export type ProductProps = { item: CatalogItem };
export type ProductCardProps = ProductProps & { selectedSlug: string; orderingEnabled?: boolean };
export type ProductImageProps = { item: CatalogItem; large?: boolean };
export type ProductDetailProps = { item: CatalogItem; catalog: Catalog; category: CatalogCategory; selectedSlug: string };
export type CatalogFailureProps = { message: string; productSlug?: string; selectedSlug?: string };
export type CategoryNavProps = { categories: CatalogCategory[]; selectedSlug: string };
