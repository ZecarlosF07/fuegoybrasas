import "server-only";

import { CartFlow } from "../components/cart-flow";
import { CartPageRecovery } from "../components/cart-page-recovery";
import type { CartStep } from "../types/cart";
import { CatalogShell } from "@/features/catalog/components/catalog-shell";
import { readCatalogForPage } from "@/features/catalog/server/read";

export async function renderCartPage(step: CartStep) {
  const result = await readCatalogForPage();
  return <CatalogShell showCartDock={false}>{result.ok ? <CartFlow catalog={result.data} step={step} /> : <CartPageRecovery step={step} message="No pudimos leer la carta. Tu borrador sigue en este dispositivo. Vuelve a intentar cuando se recupere la conexión." />}</CatalogShell>;
}
