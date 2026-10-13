import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanupBackupFixture, createBackupFixture, restoreBackupFixture } from "./backup-fixture";
import { cleanupStaffFixtures, createStaffFixture, staffPool, testAuthClient, totpCode } from "./staff-fixture";
import type { BackupFixture } from "./types/backup-fixture";
import type { StaffFixture } from "./types/staff-fixture";

const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", { auth: { persistSession: false } }).storage.from("catalog-media");
const path = `items/${randomUUID()}/${randomUUID()}.png`;
const client = testAuthClient();
let manager: StaffFixture, backup: BackupFixture | undefined, factorId: string, bytes: Buffer;
const savedFile = `.test-fixtures/h8-backup/${randomUUID()}.png`;

beforeAll(async () => {
  manager = await createStaffFixture("manager");
  expect((await client.auth.signInWithPassword({ email: manager.email, password: manager.password })).error).toBeNull();
  const factor = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Respaldo sintético H8" });
  if (factor.error || factor.data.type !== "totp") throw new Error("No se pudo preparar MFA sintético.");
  factorId = factor.data.id;
  expect((await client.auth.mfa.challengeAndVerify({ factorId, code: totpCode(factor.data.totp.secret) })).error).toBeNull();
  bytes = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).png().toBuffer();
  expect((await storage.upload(path, bytes, { contentType: "image/png" })).error).toBeNull();
});

afterAll(async () => {
  if (backup) await cleanupBackupFixture(backup);
  expect((await storage.remove([path])).error).toBeNull();
  await client.auth.signOut(); await cleanupStaffFixtures([manager].filter(Boolean)); await staffPool.end();
}, 40_000);

it("H8 restaura metadatos Storage y MFA; recupera bytes guardados por separado", async () => {
  const startedAt = performance.now();
  const downloaded = await storage.download(path);
  if (downloaded.error || !downloaded.data) throw new Error("No se pudo respaldar el archivo sintético.");
  mkdirSync(".test-fixtures/h8-backup", { recursive: true });
  writeFileSync(savedFile, Buffer.from(await downloaded.data.arrayBuffer()));
  backup = await createBackupFixture(true);
  await restoreBackupFixture(backup);
  expect((await backup.pool.query("select status from auth.mfa_factors where id=$1", [factorId])).rows[0].status).toBe("verified");
  expect((await backup.pool.query("select public from storage.buckets where id='catalog-media'")).rows[0].public).toBe(true);
  expect((await backup.pool.query("select count(*)::int count from storage.objects where bucket_id='catalog-media' and name=$1", [path])).rows[0].count).toBe(1);
  // Borrar solo este objeto sintético demuestra que el dump SQL no respalda los bytes.
  expect((await storage.remove([path])).error).toBeNull();
  expect((await storage.upload(path, readFileSync(savedFile), { contentType: "image/png" })).error).toBeNull();
  const recovered = await storage.download(path);
  if (recovered.error || !recovered.data) throw new Error("No se pudo recuperar el archivo sintético.");
  const expectedHash = createHash("sha256").update(bytes).digest("hex");
  expect(createHash("sha256").update(Buffer.from(await recovered.data.arrayBuffer())).digest("hex")).toBe(expectedHash);
  mkdirSync("docs/implementacion/evidencia/h8", { recursive: true });
  writeFileSync("docs/implementacion/evidencia/h8/restauracion.json", JSON.stringify({ checkedAt: new Date().toISOString(),
    environment: "Supabase local aislado", durationMs: Math.round(performance.now() - startedAt), databaseMetadataRestored: true,
    verifiedMfaRecordRestored: true, storageBytesRecovered: true, sha256Matches: true,
    limitations: ["Mismo clúster PostgreSQL: roles preexistentes", "Auth/Storage HTTP usan la base de origen; no se desplegó otra plataforma", "Bytes sintéticos recuperados en origen local; no restauración productiva ni medición de RPO real"] }, null, 2) + "\n");
}, 90_000);
