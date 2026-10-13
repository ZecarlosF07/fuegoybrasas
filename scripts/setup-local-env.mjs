import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

import { runSupabase } from "./lib/supabase.mjs";

if (existsSync(".env.local")) throw new Error(".env.local ya existe. Conservarlo y revisar la configuración manualmente.");
const status = JSON.parse(runSupabase(["status", "--output", "json"]));
const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
if (!publicKey || !secretKey || !status.API_URL) throw new Error("La CLI no entregó credenciales locales completas.");
const apiUrl = new URL(status.API_URL);
if (!["localhost", "127.0.0.1"].includes(apiUrl.hostname)) throw new Error("Solo se permite generar configuración de Supabase local.");
const content = [
  `NEXT_PUBLIC_SUPABASE_URL=${apiUrl.href.replace(/\/$/, "")}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publicKey}`,
  "APP_SITE_URL=http://localhost:3000",
  `SUPABASE_SECRET_KEY=${secretKey}`,
  `STAFF_AUTH_FLOW_SECRET=${randomBytes(32).toString("base64url")}`,
  `SUPABASE_LOCAL_DB_URL=${status.DB_URL}`,
  "",
].join("\n");
writeFileSync(".env.local", content, { encoding: "utf8", flag: "wx", mode: 0o600 });
console.log(".env.local creado con credenciales exclusivamente locales; sus valores no se muestran.");
