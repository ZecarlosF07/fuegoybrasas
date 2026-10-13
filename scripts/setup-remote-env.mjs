import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { runSupabase } from "./lib/supabase.mjs";

const projectRef = process.argv[2];
if (!projectRef || !/^[a-z]{20}$/.test(projectRef)) throw new Error("Indicar la referencia del proyecto remoto autorizado.");
const linkedRef = readFileSync("supabase/.temp/project-ref", "utf8").trim();
if (linkedRef !== projectRef) throw new Error("La referencia no coincide con el proyecto vinculado. Revisar antes de continuar.");
if (existsSync(".env.remote.local")) throw new Error(".env.remote.local ya existe; no sobrescribir credenciales automáticamente.");
const entries = JSON.parse(runSupabase(["projects", "api-keys", "--project-ref", projectRef, "--reveal", "--output", "json"]));
const publicKey = entries.find((entry) => entry.type === "publishable")?.api_key;
const secretKey = entries.find((entry) => entry.type === "secret")?.api_key;
if (!/^sb_publishable_[\w-]+$/.test(publicKey ?? "") || !/^sb_secret_[\w-]+$/.test(secretKey ?? "")) {
  throw new Error("La CLI no entregó las claves modernas completas del proyecto.");
}
writeFileSync(".env.remote.local", [
  "# Proyecto remoto autorizado. No ejecutar pruebas de integración o resets contra él.",
  `NEXT_PUBLIC_SUPABASE_URL=https://${projectRef}.supabase.co`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publicKey}`,
  "# Actualizar con el dominio confirmado antes del lanzamiento.",
  "APP_SITE_URL=http://localhost:3000",
  `SUPABASE_SECRET_KEY=${secretKey}`,
  `STAFF_AUTH_FLOW_SECRET=${randomBytes(32).toString("base64url")}`,
  "",
].join("\n"), { encoding: "utf8", flag: "wx", mode: 0o600 });
console.log(".env.remote.local creado e ignorado por Git. No se muestran las claves ni se reemplaza el entorno local.");
