import type { MetadataRoute } from "next";

import { publicIndexingAllowed } from "@/lib/server/indexing";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!publicIndexingAllowed(process.env)) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: ["/", "/productos/"],
    disallow: ["/administracion/", "/personal/", "/mi-tarjeta", "/tarjeta/", "/auth/", "/api/", "/pedido"] } };
}
