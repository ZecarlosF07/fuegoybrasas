import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { runSupabase } from "./lib/supabase.mjs";

const [target = "--remote", ...extraOptions] = process.argv.slice(2);
if (!["--local", "--remote"].includes(target) || extraOptions.length) throw new Error("Indicar únicamente --local o --remote para generar los tipos.");
if (target === "--remote" && readFileSync("supabase/.temp/project-ref", "utf8").trim() !== "geazxsvjkqpzbghlywbw") {
  throw new Error("Los tipos remotos requieren el proyecto autorizado geazxsvjkqpzbghlywbw.");
}
const sourceFlag = target === "--remote" ? "--linked" : "--local";
const content = runSupabase(["gen", "types", "typescript", sourceFlag, "--schema", "public,app_private"]);
if (!content.includes("export type Database")) throw new Error("La CLI no generó un esquema TypeScript válido.");
mkdirSync("src/types", { recursive: true });
writeFileSync("src/types/database.types.ts", content, "utf8");
console.log(`Tipos regenerados desde Supabase ${target === "--remote" ? "remoto" : "local"}, esquemas public y app_private.`);
