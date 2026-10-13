import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { OFFICIAL_PROJECT_REF, OFFICIAL_SUPABASE_URL } from "./lib/deployment.mjs";
import { runSupabase } from "./lib/supabase.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) throw new Error("Indicar el correo confirmado del administrador; no enviar invitaciones.");
const path = ".test-fixtures/initial-administrator.json";
if (readFileSync("supabase/.temp/project-ref", "utf8").trim() !== OFFICIAL_PROJECT_REF) throw new Error("Destino oficial no verificado.");
const environment = parseEnv(readFileSync(".env.remote.local", "utf8"));
if (environment.NEXT_PUBLIC_SUPABASE_URL !== OFFICIAL_SUPABASE_URL) throw new Error("El bootstrap exige el proyecto oficial.");
execFileSync("git", ["check-ignore", path], { stdio: "ignore" });
mkdirSync(".test-fixtures", { recursive: true });
const state = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { email, operationId: randomUUID(), password: randomBytes(24).toString("base64url"), status: "prepared" };
if (state.email !== email || !/^[a-f0-9-]{36}$/.test(state.operationId) || typeof state.password !== "string" || state.password.length < 32) throw new Error("Registro inicial inválido; revisar sin cambiar la identidad.");
writeFileSync(path, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
const readSql = `select u.id, u.raw_app_meta_data->>'fybBootstrap' marker, exists(select 1 from app_private.staff_accounts s where s.auth_user_id=u.id and s.role='manager' and s.active and s.deleted_at is null) managed from auth.users u where lower(u.email)='${email}'`;
const users = JSON.parse(runSupabase(["db", "query", "--linked", readSql, "--output", "json"]));
const admin = createClient(OFFICIAL_SUPABASE_URL, environment.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
let userId = users[0]?.id;
if (userId && users[0].marker !== state.operationId) throw new Error("Ya existe una identidad distinta: el bootstrap no cambia contraseña ni se apropia de esa cuenta.");
if (!userId) {
  const created = await admin.createUser({ email, password: state.password, email_confirm: true, app_metadata: { fybBootstrap: state.operationId } });
  if (created.error || !created.data.user) throw new Error("No se pudo confirmar el alta administrativa; conservar el registro para conciliar, sin enviar correo.");
  userId = created.data.user.id;
}
if (!/^[a-f0-9-]{36}$/.test(userId)) throw new Error("Auth no devolvió una identidad válida.");
const sqlPath = ".test-fixtures/bootstrap-official.sql";
writeFileSync(sqlPath, `begin;
set local role app_owner;
select pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0));
do $$ declare target uuid; begin
  select id into target from app_private.staff_accounts where auth_user_id='${userId}';
  if target is not null then
    if not exists(select 1 from app_private.staff_accounts where id=target and role='manager' and active and deleted_at is null) then raise exception 'CONFLICT'; end if;
    return;
  end if;
  if exists(select 1 from app_private.staff_accounts where role='manager' and active and deleted_at is null) then raise exception 'CONFLICT'; end if;
  insert into app_private.staff_accounts(auth_user_id,role,active,created_by) values('${userId}','manager',true,null) returning id into target;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields,operation_id)
    values('${userId}','bootstrap_staff','staff_account',target,'{"fields":["role","active"],"revision":1}','${state.operationId}');
end $$;
reset role;
commit;`, { mode: 0o600 });
runSupabase(["db", "query", "--linked", "--file", sqlPath, "--output", "json"]);
writeFileSync(path, JSON.stringify({ ...state, status: "created", userId, site: environment.APP_SITE_URL, mfa: "pending_self_enrollment" }, null, 2) + "\n", { mode: 0o600 });
console.log("Cuenta inicial creada y auditada sin envío de correos. Acceso privado en .test-fixtures/initial-administrator.json; MFA debe completarse al entrar. No se activaron pedidos ni fidelización.");
