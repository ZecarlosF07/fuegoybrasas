import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const secrets = [".env.local", ".env.remote.local", ".env.vercel.production"].filter(existsSync).flatMap((path) =>
  Object.entries(parseEnv(readFileSync(path, "utf8"))).filter(([key]) => ["SUPABASE_SECRET_KEY","STAFF_AUTH_FLOW_SECRET","SUPABASE_LOCAL_DB_URL"].includes(key)).map(([,value]) => value),
).filter(Boolean);
if (secrets.length === 0) throw new Error("No hay una clave de servidor para comprobar; indicar este caso como no ejecutado.");
const files = listFiles(".next/static");
for (const path of files) {
  const content = readFileSync(path, "utf8");
  if (secrets.some((secret) => content.includes(secret))) throw new Error(`Se detectó un secreto en un archivo cliente: ${path}`);
}
console.log(`PASS: ${files.length} recursos estáticos comprobados sin claves secretas locales/remotas.`);
