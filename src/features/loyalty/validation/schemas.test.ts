import { describe, expect, it } from "vitest";

import { activateSchema, cardKeySchema, costSchema, creditSchema, phoneSchema, profileSchema, programActivationSchema, redeemSchema, registerCardSchema } from "./schemas";

const customerId = "60000000-0000-4000-8000-000000000001";
const operationId = "60000000-0000-4000-8000-000000000002";
describe("Entradas críticas de fidelización", () => {
  it("permite costo desconocido sin inventar cero y conserva las confirmaciones de activación", () => {
    const identity = { programId: customerId, expectedRevision: 1, operationId };
    const input = { ...identity, costCents: null, termsVersion: "fyb-loyalty-v1", checks: { termsApproved: true, privacyApproved: true, accessTested: true, staffReady: true } };
    expect(programActivationSchema.parse(input).costCents).toBeNull();
    expect(costSchema.parse({ ...identity, costCents: null }).costCents).toBeNull();
    expect(costSchema.safeParse({ ...identity, costCents: -1 }).success).toBe(false);
    expect(programActivationSchema.safeParse({ ...input, checks: { ...input.checks, termsApproved: false } }).success).toBe(false);
  });
  it("normaliza un teléfono peruano y rechaza números parciales/extranjeros", () => {
    for (const phone of ["999000001", "+51 999-000-001", "51999000001"]) expect(phoneSchema.parse(phone)).toBe("+51999000001");
    for (const phone of ["999", "+56999000001", "899000001", "999000001x"]) expect(phoneSchema.safeParse(phone).success).toBe(false);
  });
  it("el teléfono no es una clave y el alta no acepta identidad o sellos libres", () => {
    expect(cardKeySchema.safeParse("999000001").success).toBe(false);
    expect(cardKeySchema.safeParse("a".repeat(64)).success).toBe(true);
    const value = { phone: "999000001", displayName: "Ana", termsVersion: "fyb-loyalty-v1", termsAccepted: true };
    expect(registerCardSchema.parse(value).phone).toBe("+51999000001");
    expect(registerCardSchema.safeParse({ ...value, userId: customerId }).success).toBe(false);
  });
  it("exige términos vigentes, nombre y aceptación explícita sin sello inicial", () => {
    expect(activateSchema.safeParse({ displayName: "Ana", termsVersion: "old", termsAccepted: true }).success).toBe(false);
    expect(activateSchema.safeParse({ displayName: "Ana", termsVersion: "fyb-loyalty-v1", termsAccepted: false }).success).toBe(false);
    expect(activateSchema.safeParse({ displayName: "Ana", termsVersion: "fyb-loyalty-v1", termsAccepted: true, initialStamps: 1 }).success).toBe(false);
  });
  it("acredita solo pago y entrega, acota referencias y prohíbe fechas/actor", () => {
    const input = { customerId, operationId, paidConfirmed: true, deliveredConfirmed: true, visitReference: " VISITA-1 " };
    expect(creditSchema.parse(input).visitReference).toBe("VISITA-1");
    for (const patch of [{ deliveredConfirmed: false }, { paidConfirmed: false }, { visitReference: "x".repeat(81) }, { occurredAt: "2026-01-01" }, { actorUserId: customerId }]) expect(creditSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  });
  it("el canje exige visita posterior y disponibilidad, sin compra ni importe", () => {
    const input = { customerId, operationId, rewardId: customerId, laterVisitConfirmed: true, productAvailableConfirmed: true };
    expect(redeemSchema.safeParse(input).success).toBe(true);
    expect(redeemSchema.safeParse({ ...input, laterVisitConfirmed: false }).success).toBe(false);
    expect(redeemSchema.safeParse({ ...input, purchaseAmount: 10 }).success).toBe(false);
  });
  it("permite borrar preferencias con revisión y limita datos", () => {
    expect(profileSchema.safeParse({ displayName: "Ana", frequentInstructions: "", expectedRevision: 1 }).success).toBe(true);
    expect(profileSchema.safeParse({ displayName: "Ana", frequentInstructions: "x".repeat(501), expectedRevision: 1 }).success).toBe(false);
  });
});
