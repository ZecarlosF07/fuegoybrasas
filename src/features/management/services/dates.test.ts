import { expect, it } from "vitest";

import { defaultPeriod } from "./dates";
import { periodSchema } from "../validation/schemas";

it("periodo predeterminado usa día peruano y cruza mes correctamente", () => {
  expect(defaultPeriod(new Date("2026-11-01T02:00:00Z"))).toEqual({ from: "2026-10-02", until: "2026-10-31" });
});
it("consulta rechaza inversión, fechas inválidas y periodos excesivos", () => {
  expect(periodSchema.safeParse({ from: "2026-11-01", until: "2026-10-31" }).success).toBe(false);
  expect(periodSchema.safeParse({ from: "2026-02-30", until: "2026-03-01" }).success).toBe(false);
  expect(periodSchema.safeParse({ from: "2025-01-01", until: "2026-10-31" }).success).toBe(false);
});
