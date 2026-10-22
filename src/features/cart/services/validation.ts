import { VALIDATION_TTL_MS } from "../constants";
import { validateLine } from "./validate-line";
import type { CartInput, CartValidationResult } from "../types/cart";
import { validatedCartSchema } from "../validation/schemas";
import type { ErrorCode } from "@/contracts/types/result";
import { businessStatus } from "@/features/catalog/services/business-status";
import type { Catalog } from "@/features/catalog/types/catalog";

function problem(message: string, code: ErrorCode = "VALIDATION_ERROR"): CartValidationResult { return { error: { code, message } }; }
export function validateCart(catalog: Catalog, input: CartInput, fingerprint: string): CartValidationResult {
  const config = catalog.configuration;
  if (!config.orderingEnabled) return { error: { code: "ORDERING_PAUSED", message: "Los pedidos están pausados. Conservamos tu borrador para cuando se habiliten." } };
  if (businessStatus(config, catalog.serverNow) === "closed") return problem("El local está fuera de su horario de atención. Conservamos tu borrador.", "BUSINESS_CLOSED");
  if (input.mode === "pickup" && (!config.locationVerified || !config.address)) return problem("El recojo aún no tiene una ubicación confirmada. Elige entrega o vuelve más tarde.", "MODE_NOT_ALLOWED");
  const zone = input.mode === "delivery" && input.deliveryZoneId ? config.deliveryZones.find((value) => value.id === input.deliveryZoneId) : null;
  if (input.mode === "delivery" && input.deliveryZoneId && !zone) return problem("La zona seleccionada cambió o fue retirada. Vuelve a elegir la zona.", "CATALOG_CHANGED");
  if (zone?.coverage === "excluded") return problem("La dirección está en una zona que no atendemos. Revisa tu selección.", "COVERAGE_EXCLUDED");
  const results = input.lines.map((line) => validateLine(line, catalog.items.find((item) => item.id === line.itemId), input.mode));
  const lines = results.flatMap((result) => result.canonical ? [result.canonical] : []);
  const lineIssues = results.flatMap((result) => result.issues);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  if (zone?.minimumSubtotalCents !== null && zone?.minimumSubtotalCents !== undefined && subtotalCents < zone.minimumSubtotalCents) return problem(`La zona requiere un importe mínimo de productos de S/${(zone.minimumSubtotalCents / 100).toFixed(2)}.`, "MINIMUM_NOT_MET");
  const amountCents = input.mode === "pickup" ? config.pickupChargesVerified ? config.pickupExtraCents : null : zone?.feeCents ?? null;
  const warnings: string[] = [];
  if (businessStatus(config, catalog.serverNow) === "unknown") warnings.push("Confirma el horario de atención por WhatsApp.");
  if (input.mode === "delivery" && !zone) warnings.push("La cobertura de tu dirección se coordina por WhatsApp.");
  if (input.mode === "delivery" && (!zone || zone.minimumSubtotalCents === null)) warnings.push("El mínimo de compra para esta dirección está pendiente de confirmación.");
  if (amountCents === null) warnings.push("El cargo está pendiente; el total se confirmará por WhatsApp.");
  const totalCents = amountCents === null ? null : subtotalCents + amountCents;
  const parsed = validatedCartSchema.safeParse({ status: lineIssues.length ? "needs_review" : "ready", validatedAt: catalog.serverNow, expiresAt: new Date(Date.parse(catalog.serverNow) + VALIDATION_TTL_MS).toISOString(), fingerprint, mode: input.mode, configRevision: config.revision, whatsappE164: config.whatsappE164, deliveryZone: zone ?? null, warnings, lineIssues, lines, totals: { subtotalCents, charge: { status: amountCents === null ? "pending" : "known", amountCents }, totalCents } });
  if (!parsed.success) return problem("El importe excede los límites del pedido. Reduce las cantidades.");
  return { data: parsed.data };
}
