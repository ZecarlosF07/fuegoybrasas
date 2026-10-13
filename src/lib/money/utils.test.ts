import { expect, it } from "vitest";

import { formatPen, parseSolesToCents } from "./utils";

it.each([["14.90", 1490], ["0.1", 10], ["59", 5900], ["89.90", 8990], ["0", 0]])("convierte %s sin redondeo flotante", (soles, cents) => {
  expect(parseSolesToCents(soles)).toBe(cents);
});
it.each(["14.999", "-1", "1e3", "12,50", "", " 15 ", "9007199254740991"])("rechaza importe inválido %s", (value) => {
  expect(() => parseSolesToCents(value)).toThrow();
});
it("formatea precio y conserva desconocido", () => {
  expect(formatPen(1490)).toBe("S/14.90");
  expect(formatPen(0)).toBe("S/0.00");
  expect(formatPen(null)).toBe("Por confirmar");
  expect(() => formatPen(0.5)).toThrow();
});
