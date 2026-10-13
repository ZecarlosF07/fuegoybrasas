import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogRecovery } from "@/features/catalog/components/catalog-recovery";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { ProductDetail } from "@/features/catalog/components/product-detail";
import { readCatalogForPage } from "@/features/catalog/server/read";
import { productDescription, selectedCategorySlug } from "@/features/catalog/services/presentation";
import { catalogSlugSchema } from "@/features/catalog/validation/schemas";
import { getPublicRobots } from "@/lib/server/indexing";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await readCatalogForPage();
  const item = result.ok ? result.data.items.find((entry) => entry.slug === slug) : null;
  if (!item) return { title: "Producto no disponible | Fuego y Brasas", robots: { index: false, follow: false } };
  return { title: `${item.name} | Fuego y Brasas`, description: productDescription(item), robots: getPublicRobots(), alternates: { canonical: `/productos/${item.slug}` } };
}
export default async function ProductPage({ params, searchParams }: PageProps<"/productos/[slug]">) {
  const { slug } = await params;
  if (!catalogSlugSchema.safeParse(slug).success) notFound();
  const query = await searchParams;
  const result = await readCatalogForPage();
  if (!result.ok) return <CatalogShell><CatalogRecovery message={result.error.message} productSlug={slug} selectedSlug={typeof query.categoria === "string" ? query.categoria : "todas"} /></CatalogShell>;
  const item = result.data.items.find((entry) => entry.slug === slug);
  const category = result.data.categories.find((entry) => entry.id === item?.categoryId);
  if (!item || !category) notFound();
  const selectedSlug = selectedCategorySlug(result.data, typeof query.categoria === "string" ? query.categoria : "todas");
  return <CatalogShell><ProductDetail item={item} category={category} catalog={result.data} selectedSlug={selectedSlug} /></CatalogShell>;
}
