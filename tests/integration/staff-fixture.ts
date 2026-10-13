import { createClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";

import type { JwtTestActor, StaffFixture } from "./types/staff-fixture";

const connectionString = process.env.SUPABASE_LOCAL_DB_URL;
if (!connectionString || !["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname)) throw new Error("Las pruebas de personal exigen PostgreSQL local.");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!supabaseUrl || !["127.0.0.1", "localhost"].includes(new URL(supabaseUrl).hostname)) throw new Error("Las identidades sintéticas exigen Supabase Auth local.");
export const staffPool = new Pool({ connectionString, max: 6 });
export const staffAdmin = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
export function testAuthClient() {
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export async function createStaffFixture(role: "attendant" | "manager" | null, createdBy?: string): Promise<StaffFixture> {
  const email = `h2-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const created = await staffAdmin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error("No se pudo crear la identidad sintética.");
  const userId = created.data.user.id;
  if (!role) return { userId, staffId: null, email, password };
  const staff = await staffPool.query<{ id: string }>("insert into app_private.staff_accounts(auth_user_id,role,active,created_by) values($1,$2,true,$3) returning id", [userId, role, createdBy ?? null]);
  return { userId, staffId: staff.rows[0].id, email, password };
}
export async function createInvitationFixture(createdBy: string) {
  const email = `h2-invite-${randomUUID()}@example.test`;
  // Alta administrativa previa: el hook bloquea email público, incluidas invitaciones nuevas.
  const created = await staffAdmin.createUser({ email, email_confirm: false });
  if (created.error || !created.data.user) throw new Error("No se pudo preparar la identidad administrativa sintética.");
  const invited = await staffAdmin.generateLink({ type: "invite", email, options: { redirectTo: "http://127.0.0.1:3100/auth/confirm" } });
  if (invited.error) {
    const removed = await staffAdmin.deleteUser(created.data.user.id);
    if (removed.error) throw new Error("La invitación falló y requiere limpiar la identidad sintética.");
    throw new Error("No se pudo preparar la invitación sintética.");
  }
  const userId = invited.data.user.id;
  const staff = await staffPool.query<{ id: string }>("insert into app_private.staff_accounts(auth_user_id,role,active,created_by) values($1,'attendant',true,$2) returning id", [userId, createdBy]);
  return { fixture: { userId, email, staffId: staff.rows[0].id, password: "" }, tokenHash: invited.data.properties.hashed_token };
}
// Solo el operador de pruebas local simula claims; los recorridos Auth usan JWT reales.
export async function actorQuery<T extends import("pg").QueryResultRow>(actor: JwtTestActor, sql: string, values: unknown[] = []) {
  const client = await staffPool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: actor.userId, role: "authenticated", aal: actor.aal ?? "aal2", user_metadata: { role: "manager" } })]);
    await client.query("set local role authenticated");
    const result = await client.query<T>(sql, values);
    await client.query("commit");
    return result;
  } catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); }
}
export async function cleanupStaffFixtures(fixtures: StaffFixture[]) {
  const userIds = fixtures.map((fixture) => fixture.userId);
  if (!userIds.length) return;
  const connection = await staffPool.connect();
  try {
    await connection.query("begin");
    // Excepción de limpieza del operador exclusivamente local, atómica y limitada a UUID propios.
    await connection.query("alter table app_private.audit_entries disable trigger audit_immutable");
    await connection.query("alter table app_private.operation_receipts disable trigger receipts_immutable");
    await connection.query("alter table app_private.staff_accounts disable trigger staff_not_deletable");
    await connection.query("delete from app_private.audit_entries where actor_user_id=any($1::uuid[])", [userIds]);
    await connection.query("delete from app_private.operation_receipts where actor_user_id=any($1::uuid[])", [userIds]);
    await connection.query("delete from app_private.staff_accounts where auth_user_id=any($1::uuid[])", [userIds]);
    await connection.query("alter table app_private.audit_entries enable trigger audit_immutable");
    await connection.query("alter table app_private.operation_receipts enable trigger receipts_immutable");
    await connection.query("alter table app_private.staff_accounts enable trigger staff_not_deletable");
    await connection.query("commit");
  } catch (error) { await connection.query("rollback"); throw error; }
  finally { connection.release(); }
  for (const fixture of fixtures) {
    const removed = await staffAdmin.deleteUser(fixture.userId);
    if (removed.error) throw new Error("No se pudo retirar una identidad sintética.");
  }
}
export function totpCode(secret: string, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map((letter) => alphabet.indexOf(letter).toString(2).padStart(5, "0")).join("");
  const bytes = bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) ?? [];
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const hash = createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}
