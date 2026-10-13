import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const workspaceRoot = process.cwd();
const fixturePath = resolve(workspaceRoot, ".h1-boundary-fixture");
const yarnPath = process.env.npm_execpath;
if (!yarnPath?.includes("yarn")) throw new Error("Ejecutar esta comprobación con Yarn.");
if (!fixturePath.startsWith(`${workspaceRoot}${sep}`)) throw new Error("Directorio de prueba fuera del proyecto.");

mkdirSync(fixturePath, { recursive: false });
try {
  for (const entry of ["src", "package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs", "tailwind.config.ts"]) {
    cpSync(resolve(workspaceRoot, entry), resolve(fixturePath, entry), { recursive: true });
  }
  symlinkSync(resolve(workspaceRoot, "node_modules"), resolve(fixturePath, "node_modules"), "junction");
  writeFileSync(resolve(fixturePath, "src/app/page.tsx"), [
    '"use client";',
    'import { getSecretKey } from "@/lib/env/server";',
    'export default function ForbiddenPage() { return <p>{getSecretKey()}</p>; }',
  ].join("\n"));
  // Fixture aislada: no copia secretos ni el lanzador habitual del entorno remoto.
  const result = spawnSync(process.execPath, [yarnPath, "build:local"], {
    cwd: fixturePath, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw new Error(`No se pudo ejecutar la comprobación: ${result.error.message}`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !output.includes("server-only")) {
    throw new Error("La compilación no detectó correctamente la importación prohibida.");
  }
  console.log("PASS: Next.js rechaza infraestructura server-only desde un componente cliente.");
} finally {
  // Ruta absoluta comprobada y creada por esta ejecución; no eliminar el checkout.
  rmSync(fixturePath, { recursive: true, force: true });
}
