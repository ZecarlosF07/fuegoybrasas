import type { Metadata } from "next";

import { renderCartPage } from "@/features/cart/server/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Datos del pedido | Fuego y Brasas", robots: { index: false, follow: false } };
export default async function Page() { return renderCartPage("data"); }
