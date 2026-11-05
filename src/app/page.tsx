import type { Metadata } from "next";

import { CatalogRecovery } from "@/features/catalog/components/catalog-recovery";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { CatalogView } from "@/features/catalog/components/catalog-view";
import { CATALOG_CATEGORY_PARAM, CATALOG_SEARCH_PARAM } from "@/features/catalog/constants";
import { readCatalogForPage } from "@/features/catalog/server/read";
import { catalogSearchQuery } from "@/features/catalog/services/presentation";
import { getPublicRobots } from "@/lib/server/indexing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Carta y promociones | Fuego y Brasas", description: "Consulta la carta de Fuego y Brasas en Parcona: pollo a la brasa, mostritos y promociones.",
  robots: getPublicRobots(), alternates: { canonical: "/" },
};
export default async function Home({ searchParams }: PageProps<"/">) {
  const [result, params] = await Promise.all([readCatalogForPage(), searchParams]);
  const category = params[CATALOG_CATEGORY_PARAM];
  const selectedSlug = typeof category === "string" ? category : "todas";
  const search = catalogSearchQuery(params[CATALOG_SEARCH_PARAM]);
  return <CatalogShell>{result.ok ? <CatalogView catalog={result.data} selectedSlug={selectedSlug} search={search} /> : <CatalogRecovery message={result.error.message} selectedSlug={selectedSlug} search={search} />}</CatalogShell>;
}
