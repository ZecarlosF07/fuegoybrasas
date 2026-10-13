import { beforeEach, expect, it } from "vitest";

import { CATALOG_JOURNAL_KEY } from "../constants";
import { entityFormPatch, fieldValue, newEntityRow } from "./fields";
import { catalogFingerprint, readCatalogJournal, writeCatalogJournal } from "./journal";
import { publicationIssues } from "./publication";
import type { AdminCatalog } from "../types/catalog-admin";

const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const empty: AdminCatalog = { categories: [], items: [], prices: [], promotions: [], groups: [], choices: [] };
beforeEach(() => sessionStorage.clear());
it("convierte fechas de Lima a UTC y días seleccionados sin códigos técnicos en la interfaz", () => {
  const form = new FormData();
  form.set("starts_at", "2026-10-08T15:30:00"); form.append("weekdays", "1"); form.append("weekdays", "6");
  expect(entityFormPatch("promotion", form, newEntityRow("promotion"))).toMatchObject({ starts_at: "2026-10-08T20:30:00.000Z", weekdays: [1, 6] });
  expect(fieldValue({ name: "starts_at", label: "Inicio", kind: "datetime" }, { ...newEntityRow("promotion"), starts_at: "2026-10-08T20:30:00Z" })).toBe("2026-10-08T15:30:00");
});
  it("convierte soles exactamente y no toma el precio fuente como precio online", () => {
    const form = new FormData(); form.set("price_cents", "14,90"); form.set("verified", "on");
    expect(entityFormPatch("catalog_price", form, newEntityRow("catalog_price", id), true)).toEqual({ price_cents: 1490, verified: true, item_id: id, mode: null });
    expect(newEntityRow("catalog_item").online_enabled).toBe(false);
  });
  it("retiene inclusiones como texto y omite valores que no cambian", () => {
    const row = { revision: 1, deleted_at: null, price_cents: 1500, verified: false };
    const form = new FormData(); form.set("price_cents", "15.00");
    expect(entityFormPatch("catalog_price", form, row)).toEqual({});
    form.set("price_cents", "15.999"); expect(() => entityFormPatch("catalog_price", form, row)).toThrow();
  });
  it("muestra requisitos concretos antes de publicar y prohíbe C01", () => {
    const issues = publicationIssues({ ...newEntityRow("catalog_item"), id, source_ref: "C01" }, empty);
    expect(issues.some((issue) => issue.includes("precio online"))).toBe(true);
    expect(issues.some((issue) => issue.includes("inclusiones"))).toBe(true);
    expect(issues.some((issue) => issue.includes("C01"))).toBe(true);
  });
  it("diario mínimo evita almacenar contenido, motivos o secretos y valida identidad", async () => {
    const input = { entityType: "catalog_item" as const, entityId: id, expectedRevision: 1, operationId: actor, patch: { name: "Nombre que no se persiste" } };
    const fingerprint = await catalogFingerprint(input, "save");
    writeCatalogJournal({ actorUserId: actor, entityId: id, entityType: "catalog_item", expectedRevision: 1, operationId: actor, fingerprint, kind: "save", createdAt: Date.now() });
    expect(sessionStorage.getItem(CATALOG_JOURNAL_KEY)).not.toContain("Nombre que no se persiste");
    expect(readCatalogJournal(actor)?.operationId).toBe(actor);
    expect(() => readCatalogJournal(id)).toThrow();
    expect(await catalogFingerprint({ ...input, operationId: id }, "save")).toBe(fingerprint);
  });
