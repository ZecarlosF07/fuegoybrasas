import { expect, it } from "vitest";

import { draftInput, emptyDraft, reduceDraft } from "./draft";
import { prepareMessage, validationDeadline } from "./message";
import { recoverDraft, serializeDraft } from "./storage";
import { validateCart } from "./validation";
import { cartDraft, cartInput, cartLine, checkoutCatalog, fingerprint, ZONE_ID } from "../tests/fixtures";
import { cartValidationSchema } from "../validation/schemas";

const writer = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  it("fusiona identidad normalizada, preserva instrucciones distintas y no muta el original", () => {
    const initial = reduceDraft(emptyDraft(), { type: "addLine", line: cartLine, mode: "delivery" });
    const merged = reduceDraft(initial, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: " Sin ají " }, mode: "delivery" });
    expect(merged.lines).toHaveLength(1); expect(merged.lines[0].quantity).toBe(4); expect(initial.lines[0].quantity).toBe(2);
    const separate = reduceDraft(initial, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: "Otra indicación" }, mode: "delivery" });
    expect(separate.lines).toHaveLength(2);
  });
  it("impide mezclar modalidades y exceder cantidades incluso por fusión", () => {
    expect(() => reduceDraft(cartDraft, { type: "addLine", line: cartLine, mode: "pickup" })).toThrow("modalidad");
    expect(() => reduceDraft(cartDraft, { type: "setQuantity", lineId: cartLine.lineId, quantity: 21 })).toThrow("20 unidades");
    expect(cartValidationSchema.safeParse({ ...cartInput, lines: Array.from({ length: 7 }, () => ({ ...cartInput.lines[0], lineId: crypto.randomUUID(), quantity: 20 })) }).success).toBe(false);
  });
  it("no envía nombre, dirección ni instrucciones al validador", () => {
    const input = JSON.stringify(draftInput(cartDraft));
    for (const value of ["Invitado sintético", "Dirección sintética", "Sin ají", "Tocar la puerta"]) expect(input).not.toContain(value);
    expect(cartValidationSchema.safeParse({ ...cartInput, address: "Dato personal" }).success).toBe(false);
  });
  it("separa PII de localStorage y recupera la sesión y líneas sin alterar sus IDs", () => {
    const stored = serializeDraft(cartDraft, writer);
    for (const value of ["Invitado sintético", "Dirección sintética", "Sin ají", "Tocar la puerta"]) expect(stored.commercial).not.toContain(value);
    expect(recoverDraft(stored.commercial, stored.personal, Date.parse(cartDraft.updatedAt)).draft.lines[0]).toMatchObject({ lineId: cartLine.lineId, instructions: "Sin ají", instructionsStatus: "ready" });
  });
  it("recupera borradores anteriores descartando pago y vuelto sin perder productos ni datos", () => {
    const stored = serializeDraft(cartDraft, writer);
    const previous = JSON.parse(stored.personal);
    previous.fields.paymentMethodCode = "pago-antiguo"; previous.fields.changeForCents = 10000;
    const recovered = recoverDraft(stored.commercial, JSON.stringify(previous), Date.parse(cartDraft.updatedAt));
    expect(recovered.blocked).toBe(false);
    expect(recovered.draft.checkout).toEqual(cartDraft.checkout);
    expect(recovered.draft.lines[0].instructions).toBe("Sin ají");
  });
  it("indicaciones ausentes y otra pestaña conservan líneas separadas hasta aceptación", () => {
    const separated = reduceDraft(cartDraft, { type: "addLine", line: { ...cartLine, lineId: crypto.randomUUID(), instructions: "Otro texto" }, mode: "delivery" });
    const stored = serializeDraft(separated, writer);
    const recovered = recoverDraft(stored.commercial, null);
    expect(recovered.draft.lines).toHaveLength(2); expect(recovered.draft.lines.every((line) => line.instructionsStatus === "needs_review")).toBe(true);
    expect(recoverDraft(stored.commercial, stored.personal, Date.now(), true).draft.lines[0].instructionsStatus).toBe("needs_review");
  });
  it("caducidad y versiones incompatibles exigen recuperación sin sobrescribir", () => {
    const stored = serializeDraft(cartDraft, writer);
    expect(recoverDraft(stored.commercial, stored.personal, Date.parse(cartDraft.updatedAt) + 8 * 86400000).expired).toBe(true);
    expect(recoverDraft('{"schemaVersion":2}', null).blocked).toBe(true);
    expect(recoverDraft("{roto", null).blocked).toBe(true);
    expect(recoverDraft(stored.commercial, "{roto").blocked).toBe(true);
  });
  it("cargos desconocidos permanecen NULL sin afectar el subtotal conocido", () => {
    const result = validateCart(checkoutCatalog, cartInput, fingerprint).data;
    expect(result?.status).toBe("ready"); expect(result?.totals).toEqual({ subtotalCents: 17980, charge: { status: "pending", amountCents: null }, totalCents: null });
  });
  it("cobertura, mínimos, pausa y recojo sin ubicación bloquean", () => {
    const config = checkoutCatalog.configuration;
    const zone = { id: ZONE_ID, name: "Zona sintética", coverage: "excluded" as const, feeCents: 300, minimumSubtotalCents: 0, revision: 1 };
    expect(validateCart({ ...checkoutCatalog, configuration: { ...config, deliveryZones: [zone] } }, { ...cartInput, deliveryZoneId: ZONE_ID }, fingerprint).error?.message).toContain("no atendemos");
    expect(validateCart({ ...checkoutCatalog, configuration: { ...config, deliveryZones: [{ ...zone, coverage: "allowed", minimumSubtotalCents: 20000 }] } }, { ...cartInput, deliveryZoneId: ZONE_ID }, fingerprint).error?.message).toContain("mínimo");
    expect(validateCart({ ...checkoutCatalog, configuration: { ...config, orderingEnabled: false } }, cartInput, fingerprint).error?.code).toBe("ORDERING_PAUSED");
    expect(cartValidationSchema.safeParse({ ...cartInput, paymentMethodCode: "retirado" }).success).toBe(false);
    expect(validateCart(checkoutCatalog, { ...cartInput, mode: "pickup" }, fingerprint).error).toBeDefined();
  });
  it("P05 rechaza recojo aun con ubicación y un cargo explícito cero", () => {
    expect(validateCart({ ...checkoutCatalog, configuration: { ...checkoutCatalog.configuration, locationVerified: true, address: "Ubicación sintética", pickupChargesVerified: true, pickupExtraCents: 0 } }, { ...cartInput, mode: "pickup" }, fingerprint).data?.lineIssues[0].code).toBe("MODE_NOT_ALLOWED");
  });
  it("precio/revisión y disponibilidad requieren aceptación; no cambia cantidades", () => {
    const result = validateCart({ ...checkoutCatalog, items: [{ ...checkoutCatalog.items[0], revision: 2, availability: "sold_out", prices: [{ mode: "delivery", priceCents: 9000, revision: 2 }] }] }, cartInput, fingerprint).data;
    expect(result?.status).toBe("needs_review"); expect(result?.lineIssues.map((issue) => issue.code)).toEqual(["ITEM_UNAVAILABLE", "CATALOG_CHANGED"]);
    expect(result?.lines[0].quantity).toBe(2);
  });
  it("opciones obligatorias, retiradas y adicionales se calculan canónicamente", () => {
    const choiceId = crypto.randomUUID();
    const item = { ...checkoutCatalog.items[0], optionGroups: [{ id: crypto.randomUUID(), name: "Salsa", minChoices: 1, maxChoices: 1, revision: 1, choices: [{ id: choiceId, label: "Salsa sintética", extraPriceCents: 100, revision: 1 }] }] };
    expect(validateCart({ ...checkoutCatalog, items: [item] }, cartInput, fingerprint).data?.lineIssues[0].code).toBe("VALIDATION_ERROR");
    const selected = { ...cartInput, lines: [{ ...cartInput.lines[0], choiceIds: [choiceId], observedUnitPriceCents: 9090 }] };
    expect(validateCart({ ...checkoutCatalog, items: [item] }, selected, fingerprint).data?.totals.subtotalCents).toBe(18180);
    expect(validateCart(checkoutCatalog, selected, fingerprint).data?.lineIssues[0].code).toBe("OPTION_UNAVAILABLE");
  });
  it("el reloj de pared no prolonga la vigencia monotónica", () => {
    const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
    expect(validationDeadline(700, result)).toBe(60700);
    expect(validationDeadline(700, { ...result, expiresAt: "2030-10-08T17:00:00Z" })).toBe(60700);
  });
  it("mensaje completo y URL oficial; texto largo nunca se trunca", () => {
    const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
    const prepared = prepareMessage(result, cartDraft);
    expect(prepared.url).toMatch(/^https:\/\/wa.me\/51982042493\?text=/);
    expect(prepared.message).toContain("Sin ají"); expect(prepared.message).toContain("Total: por confirmar"); expect(prepared.message).toContain("2 × Gran Promoción");
    expect(prepared.message).not.toMatch(/Pago:|Cambio para:|Indicaciones de pago:/);
    expect(result).not.toHaveProperty("paymentMethod");
    const long = prepareMessage(result, { ...cartDraft, checkout: { ...cartDraft.checkout, instructions: "🔥".repeat(250) } });
    expect(long.message).toContain("🔥".repeat(250));
    // Varias líneas válidas producen el fallback conservando todo el texto.
    const detailedLines = Array.from({ length: 30 }, () => ({ ...cartLine, lineId: crypto.randomUUID(), instructions: "Indicaciones completas ".repeat(9) }));
    const longer = { ...cartDraft, lines: detailedLines };
    const more = prepareMessage({ ...result, lines: detailedLines.map((line) => ({ ...result.lines[0], lineId: line.lineId })) }, longer);
    expect(more.long).toBe(true); expect(more.url).toBe("https://wa.me/51982042493");
  });
  it("indicaciones sin revisar impiden preparar el mensaje", () => {
    const result = validateCart(checkoutCatalog, cartInput, fingerprint).data!;
    expect(() => prepareMessage(result, { ...cartDraft, lines: [{ ...cartLine, instructionsStatus: "needs_review" }] })).toThrow("indicaciones");
  });

it("H5 recojo sin cargo confirmado mantiene total pendiente y omite dirección privada", () => {
  const item = { ...checkoutCatalog.items[0], prices: [{ mode: "pickup" as const, priceCents: 8990, revision: 1 }] };
  const config = { ...checkoutCatalog.configuration, locationVerified: true, address: "Ubicación sintética", pickupChargesVerified: false, pickupExtraCents: null };
  const result = validateCart({ ...checkoutCatalog, configuration: config, items: [item] }, { ...cartInput, mode: "pickup" }, fingerprint).data!;
  expect(result.status).toBe("ready"); expect(result.totals.totalCents).toBeNull();
  expect(prepareMessage(result, { ...cartDraft, mode: "pickup" }).message).not.toContain("Dirección sintética");
});
it("H5 horario cerrado y producto retirado no autorizan una solicitud preparada", () => {
  const config = { ...checkoutCatalog.configuration, scheduleConfirmed: true, openingPeriods: [{ day: 4, opensAt: "18:00", closesAt: "20:00", closesNextDay: false }] };
  expect(validateCart({ ...checkoutCatalog, configuration: config }, cartInput, fingerprint).error?.code).toBe("BUSINESS_CLOSED");
  const result = validateCart({ ...checkoutCatalog, items: [] }, cartInput, fingerprint).data!;
  expect(result.status).toBe("needs_review"); expect(result.lineIssues[0].code).toBe("ITEM_UNAVAILABLE");
  expect(cartDraft.lines[0].itemId).toBe(cartInput.lines[0].itemId);
});
