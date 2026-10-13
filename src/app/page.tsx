import type { Metadata } from "next";

import { CatalogRecovery } from "@/features/catalog/components/catalog-recovery";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { CatalogView } from "@/features/catalog/components/catalog-view";
import { readCatalogForPage } from "@/features/catalog/server/read";
import { getPublicRobots } from "@/lib/server/indexing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Carta y promociones | Fuego y Brasas", description: "Consulta la carta de Fuego y Brasas en Parcona: pollo a la brasa, mostritos y promociones.",
  robots: getPublicRobots(), alternates: { canonical: "/" },
};
export default async function Home({ searchParams }: PageProps<"/">) {
  const [result, params] = await Promise.all([readCatalogForPage(), searchParams]);
  const category = typeof params.categoria === "string" ? params.categoria : "todas";
  return <CatalogShell>{result.ok ? <CatalogView catalog={result.data} selectedSlug={category} /> : <CatalogRecovery message={result.error.message} />}</CatalogShell>;
}
