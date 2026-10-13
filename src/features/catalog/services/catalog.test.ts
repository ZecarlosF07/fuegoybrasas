import { describe, expect, it } from "vitest";

import { businessStatus } from "./business-status";
import { productDescription, productImageUrl, productPrice } from "./presentation";
import { catalogFixture } from "../tests/fixtures";
import { catalogSchema } from "../validation/schemas";

describe("Catálogo: dinero, contenido y contrato público", () => {
  it("valida el snapshot y rechaza campos privados, referencias y modalidad de mesa", () => {
    expect(catalogSchema.safeParse(catalogFixture).success).toBe(true);
    const item = catalogFixture.items[0];
    for (const changed of [{ ...item, sourcePriceCents: 1000 }, { ...item, deletedBy: item.id }, { ...item, prices: [{ mode: "dine_in", priceCents: 1000, revision: 1 }] }]) {
      expect(catalogSchema.safeParse({ ...catalogFixture, items: [changed] }).success).toBe(false);
    }
  });
  it("rechaza categorías huérfanas y grupos obligatorios incompletos", () => {
    expect(catalogSchema.safeParse({ ...catalogFixture, categories: [] }).success).toBe(false);
    const group = { id: crypto.randomUUID(), name: "Opciones de prueba", minChoices: 2, maxChoices: 2, revision: 1, choices: [{ id: crypto.randomUUID(), label: "Primera", extraPriceCents: 0, revision: 1 }] };
    expect(catalogSchema.safeParse({ ...catalogFixture, items: [{ ...catalogFixture.items[0], optionGroups: [group] }] }).success).toBe(false);
  });
  it("muestra Desde cuando existen precios distintos y conserva los céntimos", () => {
    const item = catalogFixture.items[0];
    expect(productPrice(item)).toBe("S/89.90");
    expect(productPrice({ ...item, prices: [...item.prices, { mode: "pickup", priceCents: 7990, revision: 1 }] })).toBe("Desde S/79.90");
    expect(productDescription(item)).toContain("1 pollo entero + ½ pollo");
  });
  it("no inventa imagen e impide rutas que no pertenecen al artículo", () => {
    const item = catalogFixture.items[0];
    expect(productImageUrl(item, "https://example.supabase.co")).toBeNull();
    expect(catalogSchema.safeParse({ ...catalogFixture, items: [{ ...item, imagePath: "items/otro/imagen.png" }] }).success).toBe(false);
  });
});

describe("Horario Lima: comienzo inclusivo y cierre exclusivo", () => {
  const config = { ...catalogFixture.configuration, scheduleConfirmed: true, openingPeriods: [{ day: 4, opensAt: "12:00", closesAt: "23:00", closesNextDay: false }] };
  it("distingue desconocido de cerrado sin depender de orderingEnabled", () => {
    expect(businessStatus(catalogFixture.configuration, catalogFixture.serverNow)).toBe("unknown");
    expect(businessStatus(config, "2026-10-08T16:59:00Z")).toBe("closed");
    expect(businessStatus(config, "2026-10-08T17:00:00Z")).toBe("open");
    expect(businessStatus(config, "2026-10-09T04:00:00Z")).toBe("closed");
  });
  it("resuelve tramo nocturno y cambio domingo-lunes", () => {
    const overnight = { ...config, openingPeriods: [{ day: 7, opensAt: "20:00", closesAt: "02:00", closesNextDay: true }] };
    expect(businessStatus(overnight, "2026-10-12T06:59:00Z")).toBe("open");
    expect(businessStatus(overnight, "2026-10-12T07:00:00Z")).toBe("closed");
  });
});
