import { VALIDATION_TTL_MS } from "../constants";
import { validateLine } from "./validate-line";
import type { CartInput, CartValidationResult } from "../types/cart";
import { validatedCartSchema } from "../validation/schemas";
import { businessStatus } from "@/features/catalog/services/business-status";
import type { Catalog } from "@/features/catalog/types/catalog";

export function validateCart(catalog: Catalog, input: CartInput, fingerprint: string): CartValidationResult {
  const config = catalog.configuration;
  if (!config.orderingEnabled) return { error: { code: "ORDERING_PAUSED", message: "Los pedidos están pausados. Conservamos tu borrador para cuando se habiliten." } };
  const status = businessStatus(config, catalog.serverNow);
  if (status === "closed") return { error: { code: "BUSINESS_CLOSED", message: "El local está fuera de su horario de atención. Conservamos tu borrador." } };
  const results = input.lines.map((line) => validateLine(line, catalog.items.find((item) => item.id === line.itemId)));
  const lines = results.flatMap((result) => result.canonical ? [result.canonical] : []);
  const lineIssues = results.flatMap((result) => result.issues);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const parsed = validatedCartSchema.safeParse({
    status: lineIssues.length ? "needs_review" : "ready", validatedAt: catalog.serverNow,
    expiresAt: new Date(Date.parse(catalog.serverNow) + VALIDATION_TTL_MS).toISOString(), fingerprint,
    configRevision: config.revision, whatsappE164: config.whatsappE164,
    warnings: status === "unknown" ? ["Confirma la atención por WhatsApp."] : [],
    lineIssues, lines, totals: { subtotalCents },
  });
  if (!parsed.success) return { error: { code: "VALIDATION_ERROR", message: "El importe excede los límites del pedido. Reduce las cantidades." } };
  return { data: parsed.data };
}
