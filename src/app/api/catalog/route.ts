import { readCatalog } from "@/features/catalog/server/read";

export const dynamic = "force-dynamic";
export async function GET() {
  const result = await readCatalog();
  return Response.json(result, { status: result.ok ? 200 : 503, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
