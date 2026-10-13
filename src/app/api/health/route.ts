import { PRIVATE_RESPONSE_HEADERS } from "@/lib/server/constants";
import { inspectRuntimeHealth } from "@/lib/server/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const result = inspectRuntimeHealth(process.env);
  return Response.json(result.body, { status: result.status, headers: PRIVATE_RESPONSE_HEADERS });
}
