import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool, testAuthClient, totpCode } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";

let manager: StaffFixture, attendant: StaffFixture;
const identities: StaffFixture[] = [];
const client = testAuthClient();
const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("catalog-media");
let category: string, item: string, path: string, bytes: Buffer;
const paths: string[] = [];
beforeAll(async () => {
  manager = await createStaffFixture("manager"); identities.push(manager);
  attendant = await createStaffFixture("attendant"); identities.push(attendant);
  await client.auth.signInWithPassword({ email: manager.email, password: manager.password });
  const factor = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: `h4-media-${randomUUID()}` });
  if (factor.error || factor.data.type !== "totp") throw new Error("MFA sintético falló.");
  expect((await client.auth.mfa.challengeAndVerify({ factorId: factor.data.id, code: totpCode(factor.data.totp.secret) })).error).toBeNull();
  bytes = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).png().toBuffer();
});
beforeEach(async () => {
  category = randomUUID(); item = randomUUID(); path = `items/${item}/${randomUUID()}.png`; paths.push(path);
  await staffPool.query("insert into public.categories(id,slug,name) values($1,'h4-media-'||$1::uuid::text,'Categoría sintética')", [category]);
  await staffPool.query("insert into public.catalog_items(id,category_id,slug,name,kind) values($1,$2,'h4-media-'||$1::uuid::text,'Producto sintético','regular')", [item, category]);
});
afterEach(async () => {
  const pg = await staffPool.connect();
  try {
    await pg.query("begin");
    await pg.query("alter table public.catalog_items disable trigger catalog_no_delete");
    await pg.query("alter table public.categories disable trigger catalog_no_delete");
    await pg.query("delete from public.catalog_items where id=$1", [item]);
    await pg.query("delete from public.categories where id=$1", [category]);
    await pg.query("alter table public.catalog_items enable trigger catalog_no_delete");
    await pg.query("alter table public.categories enable trigger catalog_no_delete");
    await pg.query("commit");
  } catch (error) { await pg.query("rollback"); throw error; } finally { pg.release(); }
});
afterAll(async () => {
  expect((await storage.remove(paths)).error).toBeNull();
  await client.auth.signOut(); await cleanupStaffFixtures(identities); await staffPool.end();
});
async function revision() { return Number((await staffPool.query("select revision from public.catalog_items where id=$1", [item])).rows[0].revision); }
async function associate(targetPath = path) { return actorQuery(manager, "select public.update_catalog_item($1,$2,$3,$4) data", [item, await revision(), JSON.stringify({ image_path: targetPath }), randomUUID()]); }
async function upload() { expect((await client.storage.from("catalog-media").upload(path, bytes, { contentType: "image/png", upsert: false })).error).toBeNull(); }

describe("H4 Storage real: permisos, asociación y limpieza", () => {
  it("MFA autoriza subida; archivo subido no modifica carta hasta asociarlo", async () => {
    await upload();
    expect((await client.rpc("get_catalog_image_upload", { p_image_path: path })).data).toBe(true);
    expect((await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0].image_path).toBeNull();
    const result = await associate();
    expect(result.rows[0].data.entityType).toBe("catalog_item");
    expect((await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0].image_path).toBe(path);
  });
  it("atención, AAL1, padre retirado y sobrescritura no pueden escribir objetos", async () => {
    const denied = testAuthClient();
    await denied.auth.signInWithPassword({ email: attendant.email, password: attendant.password });
    expect((await denied.storage.from("catalog-media").upload(path, bytes, { contentType: "image/png" })).error).not.toBeNull();
    await denied.auth.signOut();
    await denied.auth.signInWithPassword({ email: manager.email, password: manager.password });
    expect((await denied.storage.from("catalog-media").upload(path, bytes, { contentType: "image/png" })).error).not.toBeNull();
    await denied.auth.signOut();
    await upload();
    expect((await client.storage.from("catalog-media").upload(path, bytes, { contentType: "image/png", upsert: true })).error).not.toBeNull();
    await actorQuery(manager, "select public.soft_delete_entity('category',$1,1,'Motivo sintético de retiro',$2)", [category, randomUUID()]);
    expect((await client.rpc("catalog_media_upload_allowed", { p_path: `items/${item}/${randomUUID()}.png` })).data).toBe(false);
  });
  it("asociar archivo inexistente, de otro producto o reservado se rechaza", async () => {
    await expect(associate()).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    await upload();
    await expect(associate(`items/${category}/${randomUUID()}.png`)).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
    expect((await client.rpc("prepare_catalog_image_cleanup", { p_image_path: path, p_operation_id: randomUUID() })).error).toBeNull();
    await expect(associate()).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  });
  it("limpieza conserva una foto referenciada incluso cuando el producto está retirado", async () => {
    await upload(); await associate();
    await actorQuery(manager, "select public.soft_delete_entity('catalog_item',$1,$2,'Motivo sintético de retiro',$3)", [item, await revision(), randomUUID()]);
    expect((await client.rpc("prepare_catalog_image_cleanup", { p_image_path: path, p_operation_id: randomUUID() })).error?.message).toBe("CONFLICT");
    expect((await client.rpc("get_catalog_image_upload", { p_image_path: path })).data).toBe(true);
  });
  it("asociación y reserva simultáneas serializan: nunca se elimina una asociación recuperable", async () => {
    await upload(); const old = await revision();
    const results = await Promise.allSettled([
      actorQuery(manager, "select public.update_catalog_item($1,$2,$3,$4)", [item, old, JSON.stringify({ image_path: path }), randomUUID()]),
      actorQuery(manager, "select public.prepare_catalog_image_cleanup($1,$2)", [path, randomUUID()]),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const row = (await staffPool.query("select image_path from public.catalog_items where id=$1", [item])).rows[0];
    const reserved = (await staffPool.query("select count(*)::int total from app_private.operation_receipts where operation_kind='prepare_catalog_image_cleanup' and outcome->>'entityId'=$1", [path])).rows[0].total;
    expect(row.image_path ? reserved === 0 : reserved === 1).toBe(true);
  });
});
