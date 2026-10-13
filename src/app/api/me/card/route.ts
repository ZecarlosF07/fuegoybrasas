import { NextResponse } from "next/server";

import { getMyCard } from "@/features/loyalty/server/read";

export const dynamic = "force-dynamic";
export async function GET() {
  const result = await getMyCard();
  const status = result.ok ? 200 : result.error.code === "AUTH_REQUIRED" ? 401 : result.error.code === "SERVICE_UNAVAILABLE" ? 503 : result.error.code === "NOT_FOUND" ? 404 : 409;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
