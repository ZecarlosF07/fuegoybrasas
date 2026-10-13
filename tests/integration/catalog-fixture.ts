import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import type { CatalogReadRow } from "./types/catalog-fixture";

const connectionString = process.env.SUPABASE_LOCAL_DB_URL;
if (!connectionString || !["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname)) throw new Error("El catálogo sintético exige PostgreSQL local.");
export const catalogPool = new Pool({ connectionString, max: 1 });
export const CATEGORY = randomUUID();
export const ITEM = randomUUID();
export const PRICE = randomUUID();
export const GROUP = randomUUID();
export const CHOICE = randomUUID();
export const STAFF = randomUUID();
const AUTH_USER = randomUUID();

export async function beginCatalogFixture() {
  await catalogPool.query("begin");
  await catalogPool.query("insert into auth.users(id) values($1)", [AUTH_USER]);
  await catalogPool.query("insert into app_private.staff_accounts(id,auth_user_id,role,active) values($1,$2,'attendant',true)", [STAFF, AUTH_USER]);
  await catalogPool.query("insert into public.categories(id,slug,name,active) values($1,'h3-test-'||$1::uuid::text,'Categoría sintética H3',true)", [CATEGORY]);
  await catalogPool.query("insert into public.catalog_items(id,category_id,slug,name,kind,portion_label) values($1,$2,'h3-test-'||$1::uuid::text,'Producto sintético H3','regular','Porción de prueba')", [ITEM, CATEGORY]);
  await catalogPool.query("insert into public.catalog_prices(id,item_id,mode,price_cents,verified) values($1,$2,'delivery',1490,true)", [PRICE, ITEM]);
  await catalogPool.query("update public.catalog_items set online_enabled=true,publication_status='published',content_verified=true where id=$1", [ITEM]);
  await catalogPool.query("set constraints all immediate");
}
export async function readSnapshot() {
  await catalogPool.query("set local role anon");
  try {
    const result = await catalogPool.query<CatalogReadRow>("select public.read_catalog() as data");
    return result.rows[0].data;
  } finally { await catalogPool.query("reset role"); }
}
export async function makePromotion() {
  await catalogPool.query("set constraints all deferred");
  await catalogPool.query("update public.catalog_items set kind='promotion' where id=$1", [ITEM]);
  await catalogPool.query("update public.catalog_items set content_verified=true where id=$1", [ITEM]);
  await catalogPool.query("insert into public.promotions(item_id,enabled,previous_price_cents,comparison_verified) values($1,true,1990,true)", [ITEM]);
  await catalogPool.query("set constraints all immediate");
}
export async function makeOptions() {
  await catalogPool.query("set constraints all deferred");
  await catalogPool.query("insert into public.option_groups(id,item_id,name,min_choices,max_choices,active,verified) values($1,$2,'Opciones sintéticas',1,1,true,true)", [GROUP, ITEM]);
  await catalogPool.query("insert into public.option_choices(id,group_id,label,extra_price_cents,available,verified) values($1,$2,'Opción sintética',200,true,true)", [CHOICE, GROUP]);
  await catalogPool.query("set constraints all immediate");
}
export async function softDelete(table: string, id: string) {
  // Lista cerrada: helper de fixtures locales, sin entrada procedente de usuarios.
  if (!["categories", "catalog_items", "option_groups", "option_choices", "catalog_prices", "promotions"].includes(table)) throw new Error("Tabla de fixture inválida.");
  const column = table === "promotions" ? "item_id" : "id";
  await catalogPool.query(`update public.${table} set deleted_at=now(),deleted_by=$2,delete_reason='Retiro sintético para pruebas' where ${column}=$1`, [id, STAFF]);
}
