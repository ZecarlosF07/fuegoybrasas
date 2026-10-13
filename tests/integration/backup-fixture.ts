import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { staffPool } from "./staff-fixture";
import type { BackupFixture } from "./types/backup-fixture";
import type { JwtTestActor } from "./types/staff-fixture";

const container = "supabase_db_polleria-parcona";
const allowedName = /^h7_restore_[a-f0-9]{32}$/;

function docker(args: string[]) {
  const result = spawnSync("docker", ["exec", container, ...args], {
    encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const diagnostic = result.stderr?.split(/\r?\n/).find((line) => line.includes("ERROR:"))?.split("ERROR:")[1]?.slice(0, 240) ?? "";
    throw new Error(`Falló el ensayo local: ${args[0]} (${result.status ?? "sin respuesta"}). ${diagnostic}`);
  }
}

export async function createBackupFixture(includeStorage = false): Promise<BackupFixture> {
  const source = new URL(process.env.SUPABASE_LOCAL_DB_URL ?? "");
  if (!["127.0.0.1", "localhost"].includes(source.hostname) || source.pathname !== "/postgres") throw new Error("El respaldo exige la base local postgres.");
  const name = "h7_restore_" + randomUUID().replaceAll("-", "");
  const archive = `/tmp/${name}.dump`;
  if (!allowedName.test(name)) throw new Error("Destino de restauración inválido.");
  docker(["pg_dump", "-U", "postgres", "-d", "postgres", "-Fc", "--schema=public", "--schema=auth", "--schema=app_private", ...(includeStorage ? ["--schema=storage"] : []), "-f", archive]);
  await staffPool.query(`create database ${name} template template0`);
  source.pathname = "/" + name;
  return { name, archive, pool: new Pool({ connectionString: source.toString(), max: 2 }) };
}

export async function restoreBackupFixture(fixture: BackupFixture) {
  const current = (await fixture.pool.query<{ name: string }>("select current_database() name")).rows[0].name;
  if (!allowedName.test(fixture.name) || current !== fixture.name) throw new Error("La restauración solo admite su base aislada recién creada.");
  const tables = (await fixture.pool.query("select 1 from information_schema.tables where table_schema='public'")).rowCount;
  if (tables) throw new Error("El destino de restauración debe estar vacío.");
  // Dependencias de Supabase fuera del dump selectivo; roles ya existen en el clúster local.
  await fixture.pool.query('drop schema public; create schema extensions; create extension pgcrypto with schema extensions; create extension "uuid-ossp" with schema extensions');
  docker(["pg_restore", "-U", "supabase_admin", "--dbname=" + fixture.name, "--exit-on-error", fixture.archive]);
}

export async function cleanupBackupFixture(fixture: BackupFixture) {
  if (!allowedName.test(fixture.name) || fixture.archive !== `/tmp/${fixture.name}.dump`) throw new Error("Destino de limpieza inválido.");
  await fixture.pool.end();
  await staffPool.query(`drop database ${fixture.name}`);
  docker(["rm", "--", fixture.archive]);
}

export async function backupActorQuery(fixture: BackupFixture, actor: JwtTestActor, sql: string, values: unknown[]) {
  const connection = await fixture.pool.connect();
  try {
    await connection.query("begin");
    await connection.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: actor.userId, role: "authenticated", aal: "aal2" })]);
    await connection.query("set local role authenticated");
    const result = await connection.query(sql, values);
    await connection.query("commit");
    return result;
  } catch (error) { await connection.query("rollback"); throw error; }
  finally { connection.release(); }
}
