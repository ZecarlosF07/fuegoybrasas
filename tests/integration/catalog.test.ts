import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { beginCatalogFixture, CATEGORY, catalogPool, CHOICE, GROUP, ITEM, makeOptions, makePromotion, PRICE, readSnapshot, softDelete } from "./catalog-fixture";
import { catalogSchema } from "@/features/catalog/validation/schemas";

async function snapshot() { return catalogSchema.parse(await readSnapshot()); }
async function publicItem() { return (await snapshot()).items.find((item) => item.id === ITEM); }
beforeEach(beginCatalogFixture);
afterEach(async () => { await catalogPool.query("rollback"); });
afterAll(async () => { await catalogPool.end(); });

describe("Catálogo real: proyección, publicación y privilegios", () => {
  it("repetir referencia conserva UUID, ediciones y número de artículos", async () => {
    const before = (await catalogPool.query("select count(*)::integer as total from public.catalog_items")).rows[0].total;
    await catalogPool.query("update public.catalog_items set name='Nombre editado para prueba de carga',publication_status='draft' where source_ref='P05'");
    const seed = readFileSync("supabase/migrations/20261008002000_catalog_reference.sql", "utf8").replace(/^(begin;|commit;)$/gm, "");
    await catalogPool.query(seed);
    expect((await catalogPool.query("select count(*)::integer as total from public.catalog_items")).rows[0].total).toBe(before);
    expect((await catalogPool.query("select name from public.catalog_items where source_ref='P05'")).rows[0].name).toBe("Nombre editado para prueba de carga");
  });
  it("anon obtiene DTO válido, tiempo y configuración sin datos privados", async () => {
    const data = await snapshot();
    expect(data.items.find((item) => item.id === ITEM)?.prices[0].priceCents).toBe(1490);
    expect(data.configuration).toMatchObject({ orderingEnabled: false, loyaltyEnabled: false, locationVerified: true, scheduleConfirmed: false });
    expect(data.configuration.openingPeriods).toEqual([]); // Los estimados quedan exclusivamente en administración.
    expect(JSON.stringify(data)).not.toMatch(/source_ref|source_price|deleted_by|delete_reason|actor_user/);
    expect(new Date(data.serverNow).getTime()).toBeGreaterThan(Date.now() - 10_000);
  });
  it("oculta borrador, archived, modalidad de mesa y precios no verificados", async () => {
    await catalogPool.query("update public.catalog_items set publication_status='draft' where id=$1", [ITEM]);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.catalog_prices set verified=false where id=$1", [PRICE]);
    await expect(catalogPool.query("update public.catalog_items set publication_status='published' where id=$1", [ITEM])).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
  });
  it("una venta de mesa o configuración incompleta no se convierte en precio online", async () => {
    await catalogPool.query("update public.catalog_items set publication_status='draft' where id=$1", [ITEM]);
    await catalogPool.query("update public.catalog_prices set mode='dine_in' where id=$1", [PRICE]);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("alter table public.business_settings disable trigger config_not_deletable");
    await catalogPool.query("delete from public.business_settings");
    expect(await readSnapshot()).toBeNull();
  });
  it("agotado permanece visible y una nueva consulta refleja cambios y revisión", async () => {
    const before = await publicItem();
    await catalogPool.query("update public.catalog_items set availability='sold_out' where id=$1", [ITEM]);
    expect(await publicItem()).toMatchObject({ availability: "sold_out", revision: (before?.revision ?? 0) + 1 });
    await catalogPool.query("update public.catalog_prices set price_cents=1590 where id=$1", [PRICE]);
    expect((await publicItem())?.prices[0].priceCents).toBe(1590);
  });
  it("anon no puede consultar tablas directamente", async () => {
    await catalogPool.query("set local role anon");
    await expect(catalogPool.query("select * from public.catalog_items")).rejects.toMatchObject({ code: "42501" });
  });
  it("authenticated no puede cambiar precios ni acceder a tablas", async () => {
    await catalogPool.query("set local role authenticated");
    await expect(catalogPool.query("update public.catalog_prices set price_cents=1")).rejects.toMatchObject({ code: "42501" });
  });
});

describe("Conservación, restauración y ancestros", () => {
  it("eliminar una categoría oculta hijos sin destruirlos y restaurar no la activa", async () => {
    await softDelete("categories", CATEGORY);
    expect(await publicItem()).toBeUndefined();
    expect((await catalogPool.query("select count(*)::integer as total from public.catalog_items where id=$1", [ITEM])).rows[0].total).toBe(1);
    await catalogPool.query("update public.categories set deleted_at=null,deleted_by=null,delete_reason=null where id=$1", [CATEGORY]);
    expect(await publicItem()).toBeUndefined();
    expect((await catalogPool.query("select active from public.categories where id=$1", [CATEGORY])).rows[0].active).toBe(false);
  });
  it("restaurar artículo conserva identidad y exige volver a publicar", async () => {
    await softDelete("catalog_items", ITEM);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.catalog_items set deleted_at=null,deleted_by=null,delete_reason=null where id=$1", [ITEM]);
    expect((await catalogPool.query("select online_enabled,publication_status from public.catalog_items where id=$1", [ITEM])).rows[0]).toMatchObject({ online_enabled: false, publication_status: "draft" });
  });
  it("no permite restaurar hijo de categoría eliminada", async () => {
    await softDelete("catalog_items", ITEM);
    await softDelete("categories", CATEGORY);
    await expect(catalogPool.query("update public.catalog_items set deleted_at=null,deleted_by=null,delete_reason=null where id=$1", [ITEM])).rejects.toMatchObject({ message: "CONFLICT" });
  });
  it("retiene clave única después de borrar y rechaza eliminación física", async () => {
    await softDelete("catalog_items", ITEM);
    await expect(catalogPool.query("insert into public.catalog_items(category_id,slug,name,kind) select category_id,slug,name,kind from public.catalog_items where id=$1", [ITEM])).rejects.toMatchObject({ code: "23505" });
  });
  it("DELETE físico falla incluso para el operador de pruebas", async () => {
    await expect(catalogPool.query("delete from public.catalog_items where id=$1", [ITEM])).rejects.toMatchObject({ message: "FORBIDDEN" });
  });
  it("precio restaurado pierde verificación y no permite publicar en categoría inactiva", async () => {
    await catalogPool.query("update public.catalog_items set publication_status='draft' where id=$1", [ITEM]);
    await softDelete("catalog_prices", PRICE);
    await catalogPool.query("update public.catalog_prices set deleted_at=null,deleted_by=null,delete_reason=null where id=$1", [PRICE]);
    expect((await catalogPool.query("select verified from public.catalog_prices where id=$1", [PRICE])).rows[0].verified).toBe(false);
    await catalogPool.query("update public.categories set active=false where id=$1", [CATEGORY]);
    await expect(catalogPool.query("update public.catalog_items set publication_status='published' where id=$1", [ITEM])).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
  });
});

describe("Promociones y opciones confirmadas", () => {
  it("comparador confirmado aparece y cambio de precio lo invalida", async () => {
    await makePromotion();
    expect((await publicItem())?.promotion?.previousPriceCents).toBe(1990);
    await catalogPool.query("update public.catalog_prices set price_cents=1590 where id=$1", [PRICE]);
    expect((await publicItem())?.promotion?.previousPriceCents).toBeNull();
  });
  it("cambio de composición invalida el precio anterior", async () => {
    await makePromotion();
    await catalogPool.query("set constraints all deferred");
    await catalogPool.query("update public.catalog_items set inclusions=array['Contenido sintético nuevo'] where id=$1", [ITEM]);
    await catalogPool.query("update public.catalog_items set content_verified=true where id=$1", [ITEM]);
    await catalogPool.query("set constraints all immediate");
    expect((await publicItem())?.promotion?.previousPriceCents).toBeNull();
  });
  it("inicio inclusivo, fin exclusivo, días Lima y pausa excluyen promoción", async () => {
    await makePromotion();
    await catalogPool.query("update public.promotions set starts_at=now(),ends_at=now()+interval '1 hour',weekdays=array[extract(isodow from now() at time zone 'America/Lima')::smallint] where item_id=$1", [ITEM]);
    expect(await publicItem()).toBeDefined();
    await catalogPool.query("update public.promotions set ends_at=now(),starts_at=now()-interval '1 hour' where item_id=$1", [ITEM]);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.promotions set ends_at=null,weekdays=array[(extract(isodow from now() at time zone 'America/Lima')::int%7+1)::smallint] where item_id=$1", [ITEM]);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.promotions set weekdays=null,enabled=false where item_id=$1", [ITEM]);
    expect(await publicItem()).toBeUndefined();
  });
  it("futuro y promoción eliminada se ocultan sin eliminar identidad", async () => {
    await makePromotion();
    await catalogPool.query("update public.promotions set starts_at=now()+interval '1 hour' where item_id=$1", [ITEM]);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.catalog_items set publication_status='draft' where id=$1", [ITEM]);
    await softDelete("promotions", ITEM);
    expect(await publicItem()).toBeUndefined();
    await catalogPool.query("update public.promotions set deleted_at=null,deleted_by=null,delete_reason=null where item_id=$1", [ITEM]);
    expect((await catalogPool.query("select enabled,comparison_verified from public.promotions where item_id=$1", [ITEM])).rows[0]).toMatchObject({ enabled: false, comparison_verified: false });
  });
  it("opciones verificadas muestran recargo y modificaciones avanzan revisión padre", async () => {
    await makeOptions();
    const previous = await publicItem();
    expect(previous?.optionGroups[0].choices[0].extraPriceCents).toBe(200);
    await catalogPool.query("update public.option_choices set extra_price_cents=300 where id=$1", [CHOICE]);
    expect((await publicItem())?.revision).toBeGreaterThan(previous?.revision ?? 0);
  });
  it("grupo obligatorio sin suficientes opciones se oculta y no permite cerrar publicación inválida", async () => {
    await makeOptions();
    await catalogPool.query("set constraints all deferred");
    await catalogPool.query("update public.option_choices set verified=false where id=$1", [CHOICE]);
    expect(await publicItem()).toBeUndefined();
    await expect(catalogPool.query("set constraints all immediate")).rejects.toMatchObject({ message: "CONFIG_NOT_READY" });
  });
  it("grupos opcionales y opciones eliminadas no salen y restaurar no las activa", async () => {
    await makeOptions();
    await catalogPool.query("update public.option_groups set min_choices=0 where id=$1", [GROUP]);
    await softDelete("option_choices", CHOICE);
    expect((await publicItem())?.optionGroups).toEqual([]);
    await catalogPool.query("update public.option_choices set deleted_at=null,deleted_by=null,delete_reason=null where id=$1", [CHOICE]);
    expect((await catalogPool.query("select available,verified from public.option_choices where id=$1", [CHOICE])).rows[0]).toMatchObject({ available: false, verified: false });
    await softDelete("option_groups", GROUP);
    expect((await publicItem())?.optionGroups).toEqual([]);
  });
});
