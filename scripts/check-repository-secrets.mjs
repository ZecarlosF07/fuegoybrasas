import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
const privateNames = ["SUPABASE_SECRET_KEY", "STAFF_AUTH_FLOW_SECRET", "SUPABASE_LOCAL_DB_URL", "GITHUB_TOKEN", "VERCEL_TOKEN"];
const secrets = [".env.local", ".env.remote.local", ".env.vercel.local"].filter(existsSync).flatMap(path =>
  Object.entries(parseEnv(readFileSync(path, "utf8"))).filter(([name, value]) => privateNames.includes(name) && value).map(([, value]) => value));
const forbidden = files.filter(path => /(?:^|\/)\.env(?!\.example$)|^\.test-fixtures\/|^\.vercel\/|\.pem$/i.test(path));
const leaked = files.filter(path => existsSync(path) && secrets.some(secret => readFileSync(path).includes(Buffer.from(secret))));
if (forbidden.length || leaked.length) throw new Error("Archivos privados detectados: " + [...new Set([...forbidden, ...leaked])].join(", "));
console.log(`PASS: ${files.filter(existsSync).length} archivos candidatos sin credenciales configuradas ni archivos privados versionados.`);
