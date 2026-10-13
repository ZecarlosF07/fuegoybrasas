import { createHash, randomUUID } from "node:crypto";

import { CART_BODY_BYTES } from "@/features/cart/constants";
import { validateCart } from "@/features/cart/services/validation";
import { cartValidationSchema } from "@/features/cart/validation/schemas";
import { readCatalog } from "@/features/catalog/server/read";
import { BodyError, readBoundedBody } from "@/lib/server/request-body";
import { hasExpectedOrigin } from "@/lib/server/request-origin";
import { invalidInput } from "@/lib/server/results";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    if (!hasExpectedOrigin(request, false)) return Response.json({ ok: false, requestId, error: { code: "FORBIDDEN", message: "Prepara el pedido desde este sitio." } }, { status: 403, headers });
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new BodyError(415, "Envía un pedido JSON válido.");
    const bytes = await readBoundedBody(request, CART_BODY_BYTES);
    let payload: unknown;
    try { payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new BodyError(400, "La solicitud no contiene JSON válido."); }
    const input = cartValidationSchema.safeParse(payload);
    if (!input.success) return Response.json(invalidInput(input.error, requestId), { status: 400, headers });
    const catalog = await readCatalog();
    if (!catalog.ok) return Response.json(catalog, { status: 503, headers });
    const normalized = { ...input.data, lines: input.data.lines.map((line) => ({ ...line, choiceIds: [...line.choiceIds].sort() })) };
    const fingerprint = createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
    const result = validateCart(catalog.data, input.data, fingerprint);
    return Response.json(result.error ? { ok: false, requestId, error: result.error } : { ok: true, requestId, data: result.data }, { status: result.error ? 422 : 200, headers });
  } catch (error) {
    const status = error instanceof BodyError ? error.status : 503;
    return Response.json({ ok: false, requestId, error: { code: error instanceof BodyError ? "VALIDATION_ERROR" : "SERVICE_UNAVAILABLE", message: error instanceof BodyError ? error.message : "No pudimos validar el pedido. Conserva el borrador y vuelve a intentar." } }, { status, headers });
  }
}
