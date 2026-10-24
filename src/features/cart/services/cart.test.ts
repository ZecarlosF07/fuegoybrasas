import { expect, it } from "vitest";

import { draftInput, emptyDraft, reduceDraft } from "./draft";
import { prepareMessage, validationDeadline } from "./message";
import { recoverDraft, serializeDraft } from "./storage";
import { validateCart } from "./validation";
import { cartDraft, cartInput, cartLine, checkoutCatalog, fingerprint } from "../tests/fixtures";
import { cartValidationSchema } from "../validation/schemas";
import type { CatalogItem } from "@/features/catalog/types/catalog";

const writer = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
it("fusiona identidad normalizada sin mutar el original y conserva indicaciones distintas", () => {
  const initial = reduceDraft(emptyDraft(), { type: "addLine", line: cartLine });
  const merged = reduceDraft(initial, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: " Sin ají " } });
  expect(merged.lines).toHaveLength(1); expect(merged.lines[0].quantity).toBe(4); expect(initial.lines[0].quantity).toBe(2);
  expect(reduceDraft(initial, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: "Otra indicación" } }).lines).toHaveLength(2);
});
it("valida cantidades, fusiones y máximo total sin requerir modalidad", () => {
  expect(() => reduceDraft(cartDraft, { type: "setQuantity", lineId: cartLine.lineId, quantity: 21 })).toThrow("20 unidades");
  expect(() => reduceDraft(cartDraft, { type: "addLine", line: { ...cartLine, quantity: 20 } })).toThrow();
  expect(cartValidationSchema.safeParse({ ...cartInput, lines: Array.from({ length: 7 }, () => ({ ...cartInput.lines[0], lineId: crypto.randomUUID(), quantity: 20 })) }).success).toBe(false);
  expect(cartValidationSchema.safeParse(cartInput).success).toBe(true);
});
it("API acepta solo líneas, sin datos personales, modalidad, zona ni pago", () => {
  expect(Object.keys(draftInput(cartDraft))).toEqual(["lines"]);
  expect(JSON.stringify(draftInput(cartDraft))).not.toContain("Sin ají");
  for (const field of ["mode", "deliveryZoneId", "name", "address", "paymentMethodCode"]) {
    expect(cartValidationSchema.safeParse({ ...cartInput, [field]: "retirado" }).success).toBe(false);
  }
});
it("separa indicaciones del almacenamiento comercial y conserva identidades", () => {
  const stored = serializeDraft(cartDraft, writer);
  expect(stored.commercial).not.toContain("Sin ají"); expect(stored.commercial).not.toContain('"mode"');
  expect(recoverDraft(stored.commercial, stored.personal, Date.parse(cartDraft.updatedAt)).draft.lines[0]).toMatchObject({ lineId: cartLine.lineId, instructions: "Sin ají", instructionsStatus: "ready" });
});
it("migra borrador anterior descartando modalidad y datos retirados, conservando platos", () => {
  const stored = serializeDraft(cartDraft, writer);
  const previous = JSON.parse(stored.personal);
  previous.fields = { ...previous.fields, name: "Nombre anterior", address: "Dirección anterior", reference: "Referencia", deliveryZoneId: writer, paymentMethodCode: "antiguo", changeForCents: 10000 };
  const commercial = JSON.stringify({ ...JSON.parse(stored.commercial), mode: "pickup" });
  const recovered = recoverDraft(commercial, JSON.stringify(previous), Date.parse(cartDraft.updatedAt));
  expect(recovered.blocked).toBe(false); expect(recovered.draft).not.toHaveProperty("mode");
  expect(recovered.draft.checkout).toEqual(cartDraft.checkout); expect(recovered.draft.lines[0].instructions).toBe("Sin ají");
});
it("indicaciones ausentes y otras pestañas requieren revisión expresa", () => {
  const separated = reduceDraft(cartDraft, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: "Otro texto" } });
  const stored = serializeDraft(separated, writer);
  const recovered = recoverDraft(stored.commercial, null, Date.parse(cartDraft.updatedAt));
  expect(recovered.draft.lines).toHaveLength(2); expect(recovered.draft.lines.every((line) => line.instructionsStatus === "needs_review")).toBe(true);
  expect(recoverDraft(stored.commercial, stored.personal, Date.parse(cartDraft.updatedAt), true).draft.lines[0].instructionsStatus).toBe("needs_review");
});
it("caducidad y formatos dañados no se sobrescriben sin autorización", () => {
  const stored = serializeDraft(cartDraft, writer);
  expect(recoverDraft(stored.commercial, stored.personal, Date.parse(cartDraft.updatedAt) + 8 * 86400000).expired).toBe(true);
  for (const text of ['{"schemaVersion":2}', "{roto"]) expect(recoverDraft(text, null).blocked).toBe(true);
  expect(recoverDraft(stored.commercial, "{roto").blocked).toBe(true);
});
it("calcula únicamente productos aunque existan cargos configurados", () => {
  const catalog = { ...checkoutCatalog, configuration: { ...checkoutCatalog.configuration, pickupExtraCents: 900, pickupChargesVerified: true, locationVerified: false } };
  expect(validateCart(catalog, cartInput, fingerprint).data?.totals).toEqual({ subtotalCents: 17980 });
});
it("conserva pausa del negocio y rechaza campos retirados", () => {
  expect(validateCart({ ...checkoutCatalog, configuration: { ...checkoutCatalog.configuration, orderingEnabled: false } }, cartInput, fingerprint).error?.code).toBe("ORDERING_PAUSED");
});
it("acepta precio único y nunca elige el menor cuando hay precios contradictorios", () => {
  const original = checkoutCatalog.items[0];
  const equal: CatalogItem = { ...original, prices: [...original.prices, { mode: "pickup", priceCents: 8990, revision: 1 }] };
  expect(validateCart({ ...checkoutCatalog, items: [equal] }, cartInput, fingerprint).data?.status).toBe("ready");
  const conflict: CatalogItem = { ...equal, prices: [equal.prices[0], { mode: "pickup", priceCents: 7990, revision: 1 }] };
  const result = validateCart({ ...checkoutCatalog, items: [conflict] }, cartInput, fingerprint).data;
  expect(result?.status).toBe("needs_review"); expect(result?.lines).toHaveLength(0); expect(result?.lineIssues[0].code).toBe("CATALOG_CHANGED");
});
it("precio, revisión y agotados exigen aceptación sin cambiar cantidades", () => {
  const item: CatalogItem = { ...checkoutCatalog.items[0], revision: 2, availability: "sold_out", prices: [{ mode: "delivery", priceCents: 9000, revision: 2 }] };
  const result = validateCart({ ...checkoutCatalog, items: [item] }, cartInput, fingerprint).data;
  expect(result?.status).toBe("needs_review"); expect(result?.lineIssues.map((issue) => issue.code)).toEqual(["ITEM_UNAVAILABLE", "CATALOG_CHANGED"]); expect(result?.lines[0].quantity).toBe(2);
});
it("opciones obligatorias, retiradas y adicionales siguen validándose en servidor", () => {
  const choiceId = crypto.randomUUID();
  const item = { ...checkoutCatalog.items[0], optionGroups: [{ id: crypto.randomUUID(), name: "Salsa", minChoices: 1, maxChoices: 1, revision: 1, choices: [{ id: choiceId, label: "Salsa sintética", extraPriceCents: 100, revision: 1 }] }] };
  expect(validateCart({ ...checkoutCatalog, items: [item] }, cartInput, fingerprint).data?.lineIssues[0].code).toBe("VALIDATION_ERROR");
  const selected = { ...cartInput, lines: [{ ...cartInput.lines[0], choiceIds: [choiceId], observedUnitPriceCents: 9090 }] };
  expect(validateCart({ ...checkoutCatalog, items: [item] }, selected, fingerprint).data?.totals.subtotalCents).toBe(18180);
  expect(validateCart(checkoutCatalog, selected, fingerprint).data?.lineIssues[0].code).toBe("OPTION_UNAVAILABLE");
});
it("la vigencia monotónica no se prolonga con el reloj de pared", () => {
  const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
  expect(validationDeadline(700, result)).toBe(60700); expect(validationDeadline(700, { ...result, expiresAt: "2030-10-08T17:00:00Z" })).toBe(60700);
});
it("mensaje completo solo contiene platos, indicaciones y subtotal; WhatsApp coordina envío", () => {
  const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
  const prepared = prepareMessage(result, cartDraft);
  expect(prepared.url).toMatch(/^https:\/\/wa.me\/51982042493\?text=/); expect(prepared.message).toContain("2 × Gran Promoción"); expect(prepared.message).toContain("Sin ají");
  expect(prepared.message).toContain("Subtotal de productos: S/179.80");
  expect(prepared.message).not.toMatch(/Nombre:|Modalidad:|Dirección:|Zona:|Cargo:|Total:|Pago:|Cambio para:/);
  expect(prepared.message).toContain("Coordinamos la entrega y el costo de envío por este chat.");
});
it("texto largo se conserva íntegro y usa el enlace corto sin truncarlo", () => {
  const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
  const detailed = Array.from({ length: 30 }, () => ({ ...cartLine, lineId: crypto.randomUUID(), instructions: "Indicaciones completas ".repeat(9) }));
  const prepared = prepareMessage({ ...result, lines: detailed.map((line) => ({ ...result.lines[0], lineId: line.lineId })) }, { ...cartDraft, lines: detailed });
  expect(prepared.long).toBe(true); expect(prepared.url).toBe("https://wa.me/51982042493"); expect(prepared.message.match(/Indicaciones:/g)).toHaveLength(30);
});
it("indicaciones pendientes, horario cerrado y productos retirados conservan el borrador", () => {
  const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
  expect(() => prepareMessage(result, { ...cartDraft, lines: [{ ...cartLine, instructionsStatus: "needs_review" }] })).toThrow("indicaciones");
  const config = { ...checkoutCatalog.configuration, scheduleConfirmed: true, openingPeriods: [{ day: 4, opensAt: "18:00", closesAt: "20:00", closesNextDay: false }] };
  expect(validateCart({ ...checkoutCatalog, configuration: config }, cartInput, fingerprint).error?.code).toBe("BUSINESS_CLOSED");
  expect(validateCart({ ...checkoutCatalog, items: [] }, cartInput, fingerprint).data?.lineIssues[0].code).toBe("ITEM_UNAVAILABLE");
  expect(cartDraft.lines[0].itemId).toBe(cartInput.lines[0].itemId);
});
