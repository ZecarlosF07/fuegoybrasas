import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../../node_modules/supabase/dist/supabase.js", import.meta.url));

export function runSupabase(args, { diagnostics = false } = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args, "--agent=no"], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: "1", DO_NOT_TRACK: "1" },
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw new Error(`No se pudo ejecutar Supabase: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Supabase terminó con código ${result.status}. ${safeOutput(result.stderr)}`);
  if (diagnostics) console.log(safeOutput(result.stderr));
  return result.stdout;
}

export function safeOutput(output) {
  return output.split(/\r?\n/).filter((line) =>
    !/sb_secret_|sb_publishable_|\beyJ|password|secret|access.{0,5}key|authorization|jwt|anon.{0,10}key|service_role|postgres(?:ql)?:\/\//i.test(line),
  ).join("\n");
}
