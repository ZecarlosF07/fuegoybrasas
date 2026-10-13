import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

process.loadEnvFile(".env.local");
const userId = process.argv[2];
if (!userId || !/^[a-f0-9-]{36}$/i.test(userId)) throw new Error("Uso: yarn staff:bootstrap:local <UUID Auth verificado>.");
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_LOCAL_DB_URL"]) {
  if (!process.env[key] || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env[key]).hostname)) throw new Error("Bootstrap disponible únicamente en local.");
}
const authAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
const verified = await authAdmin.getUserById(userId);
if (verified.error || !verified.data.user?.email_confirmed_at) throw new Error("La identidad Auth debe tener correo verificado.");
const pool = new Pool({ connectionString: process.env.SUPABASE_LOCAL_DB_URL });
const connection = await pool.connect();
try {
  await connection.query("begin");
  await connection.query("select pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0))");
  const existing = await connection.query("select id from app_private.staff_accounts where active and deleted_at is null and role='manager'");
  if (existing.rowCount !== 0) throw new Error("Ya existe un responsable activo. El bootstrap no modifica cuentas existentes.");
  const staff = await connection.query("insert into app_private.staff_accounts(auth_user_id,role,active,created_by) values($1,'manager',true,null) returning id", [userId]);
  await connection.query("insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields,operation_id) values($1,'bootstrap_staff','staff_account',$2,'{\"fields\":[\"role\",\"active\"],\"revision\":1}',$3)", [userId, staff.rows[0].id, randomUUID()]);
  await connection.query("commit");
  console.log("Responsable local creado y auditado. No se habilitaron pedidos ni fidelización.");
} catch (error) {
  await connection.query("rollback");
  console.error(error instanceof Error && !/password|secret|postgresql|eyJ/i.test(error.message) ? error.message : "Bootstrap rechazado.");
  process.exitCode = 1;
} finally { connection.release(); await pool.end(); }
