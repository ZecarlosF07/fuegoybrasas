import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";

const connectionString = process.env.SUPABASE_LOCAL_DB_URL;
if (!connectionString || !["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname)) throw new Error("E2E catálogo solo permite datos sintéticos locales.");
const pool = new Pool({ connectionString, max: 1 });
const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("catalog-media");
export const E2E_CATEGORY = randomUUID();
export const E2E_ITEM = randomUUID();
export const E2E_SOLD_OUT = randomUUID();
export const E2E_DRAFT = randomUUID();
export const E2E_IMAGE = `items/${E2E_ITEM}/${randomUUID()}.png`;
export const E2E_SLUG = `h3-e2e-${E2E_ITEM}`;
export const E2E_CATEGORY_SLUG = `h3-e2e-${E2E_CATEGORY}`;
const ids = [E2E_ITEM, E2E_SOLD_OUT, E2E_DRAFT];

export async function prepareCatalogE2E() {
  const image = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).png().toBuffer();
  const upload = await storage.upload(E2E_IMAGE, image, { contentType: "image/png" });
  if (upload.error) throw new Error("No se pudo preparar la imagen sintética local.");
  await pool.query("begin");
  await pool.query("insert into public.categories(id,slug,name,sort_order,active) values($1,$2,'Pruebas H3',99,true)", [E2E_CATEGORY, E2E_CATEGORY_SLUG]);
  await pool.query("insert into public.catalog_items(id,category_id,slug,name,kind,portion_label,sort_order,availability) values($1,$2,$3,'Plato sintético H3','regular','Porción sintética',1,'available'),($4,$2,'h3-e2e-'||$4::uuid::text,'Plato agotado H3','regular','Porción sintética',2,'sold_out'),($5,$2,'h3-e2e-'||$5::uuid::text,'Borrador confidencial H3','regular',null,3,'available')", [E2E_ITEM, E2E_CATEGORY, E2E_SLUG, E2E_SOLD_OUT, E2E_DRAFT]);
  await pool.query("insert into public.catalog_prices(item_id,mode,price_cents,verified) values($1,'delivery',1590,true),($1,'pickup',1490,true),($2,'delivery',2000,true)", [E2E_ITEM, E2E_SOLD_OUT]);
  await pool.query("update public.catalog_items set image_path=$2 where id=$1", [E2E_ITEM, E2E_IMAGE]);
  await pool.query("update public.catalog_items set publication_status='published',online_enabled=true,content_verified=true where id=any($1::uuid[])", [[E2E_ITEM, E2E_SOLD_OUT]]);
  await pool.query("commit");
}
export async function cleanupCatalogE2E() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Limpieza del operador local, limitada a UUID propios; conserva las 29 referencias.
    await client.query("alter table public.catalog_prices disable trigger catalog_no_delete");
    await client.query("alter table public.catalog_items disable trigger catalog_no_delete");
    await client.query("alter table public.categories disable trigger catalog_no_delete");
    await client.query("delete from public.catalog_prices where item_id=any($1::uuid[])", [ids]);
    await client.query("delete from public.catalog_items where id=any($1::uuid[])", [ids]);
    await client.query("delete from public.categories where id=$1", [E2E_CATEGORY]);
    await client.query("alter table public.catalog_prices enable trigger catalog_no_delete");
    await client.query("alter table public.catalog_items enable trigger catalog_no_delete");
    await client.query("alter table public.categories enable trigger catalog_no_delete");
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); await pool.end(); }
  const removed = await storage.remove([E2E_IMAGE]);
  if (removed.error) throw new Error("No se pudo retirar la imagen sintética local.");
}
