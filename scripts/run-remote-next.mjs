import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

import { deploymentProblems } from "./lib/deployment.mjs";

const NEXT_COMMANDS = new Set(["dev", "build", "start"]);
const REMOTE_SUPABASE_URL = "https://geazxsvjkqpzbghlywbw.supabase.co";
const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const remoteEnvFile = new URL("../.env.remote.local", import.meta.url);
const nextExecutable = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const [command, ...options] = process.argv.slice(2);

if (!NEXT_COMMANDS.has(command)) throw new Error("Indicar dev, build o start para el entorno remoto.");

try {
  // Cargar valores sin --env-file: Next reenvía execArgv a sus procesos internos.
  // En hosting se inyectan las variables; no se despliegan archivos con secretos.
  if (existsSync(remoteEnvFile)) loadEnvFile(remoteEnvFile);
} catch {
  throw new Error("No se pudo leer .env.remote.local. Preparar el entorno remoto antes de iniciar Next.js.");
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL !== REMOTE_SUPABASE_URL) {
  throw new Error("Los comandos habituales requieren el Supabase remoto autorizado. Revisar .env.remote.local o las variables del hosting; usar comandos :local solo para pruebas aisladas.");
}

process.env.SUPABASE_LOCAL_DB_URL = "";
if (process.env.APP_DEPLOYMENT_TARGET === "production" || process.env.VERCEL_ENV) {
  const problems = deploymentProblems(process.env);
  if (problems.length) throw new Error("Publicación no configurada: " + problems.join(", ") + ". Revisar las variables de Vercel; no se muestran claves.");
  process.env.APP_RELEASE_ID ||= process.env.VERCEL_GIT_COMMIT_SHA;
}
console.info(`Supabase remoto: ${REMOTE_SUPABASE_URL}`);

const nextProcess = spawn(process.execPath, [nextExecutable, command, ...options], {
  cwd: projectDirectory,
  env: process.env,
  stdio: "inherit",
});

nextProcess.once("error", (error) => {
  console.error(`No se pudo iniciar Next.js (${error.code ?? "ERROR"}).`);
  process.exitCode = 1;
});

nextProcess.once("exit", (code, signal) => {
  if (signal) console.error(`Next.js terminó por la señal ${signal}.`);
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => nextProcess.kill(signal));
}
