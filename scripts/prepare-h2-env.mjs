import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { runSupabase } from "./lib/supabase.mjs";

for (const path of [".env.local", ".env.remote.local"]) {
  if (!existsSync(path)) continue;
  const environment = parseEnv(readFileSync(path,"utf8"));
  const additions = [];
  if (!environment.STAFF_AUTH_FLOW_SECRET) additions.push(`STAFF_AUTH_FLOW_SECRET=${randomBytes(32).toString("base64url")}`);
  if (path === ".env.local" && !environment.SUPABASE_LOCAL_DB_URL) {
    const status = JSON.parse(runSupabase(["status","--output","json"]));
    const databaseUrl = new URL(status.DB_URL);
    if (!["127.0.0.1","localhost"].includes(databaseUrl.hostname)) throw new Error("La base de pruebas debe ser local.");
    additions.push(`SUPABASE_LOCAL_DB_URL=${databaseUrl.href}`);
  }
  if (additions.length) appendFileSync(path,`\n# H2: valores exclusivos del servidor/pruebas.\n${additions.join("\n")}\n`);
}
console.log("Configuración de H2 preparada sin sobrescribir valores ni mostrar secretos.");
