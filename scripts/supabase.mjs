import { runSupabase, safeOutput } from "./lib/supabase.mjs";

const args = process.argv.slice(2);
if (args.includes("--linked") || args.includes("--db-url")) {
  throw new Error("Estos scripts son exclusivamente locales. Usar el procedimiento de despliegue para remoto.");
}
console.log(safeOutput(runSupabase(args, { diagnostics: true })));
