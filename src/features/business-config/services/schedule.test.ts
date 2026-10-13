import { describe, expect, it } from "vitest";

import { configChangeSchema } from "../validation/schemas";

const operationId = "8c9636e3-7f8d-4768-a77e-931279453f30";
function accepts(openingPeriods: unknown) { return configChangeSchema.safeParse({ operationId, expectedRevision: 1, patch: { openingPeriods } }).success; }
describe("horarios canónicos y validación H2", () => {
  it("admite pendiente y turnos adyacentes", () => {
    expect(accepts([])).toBe(true);
    expect(accepts([{ day: 1, opensAt: "12:00", closesAt: "15:00", closesNextDay: false }, { day: 1, opensAt: "15:00", closesAt: "18:00", closesNextDay: false }])).toBe(true);
  });
  it("rechaza solapamiento al cruzar semana y horario sin duración", () => {
    expect(accepts([{ day: 7, opensAt: "23:00", closesAt: "02:00", closesNextDay: true }, { day: 1, opensAt: "01:00", closesAt: "04:00", closesNextDay: false }])).toBe(false);
    expect(accepts([{ day: 1, opensAt: "12:00", closesAt: "12:00", closesNextDay: false }])).toBe(false);
  });
  it("rechaza campos libres y delega la habilitación al servidor", () => {
    expect(configChangeSchema.safeParse({ operationId, expectedRevision: 1, patch: { actor: "manager" } }).success).toBe(false);
    expect(configChangeSchema.safeParse({ operationId, expectedRevision: 1, patch: { loyaltyEnabled: true } }).success).toBe(true);
  });
});
