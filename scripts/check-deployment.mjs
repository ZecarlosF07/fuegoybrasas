import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parseEnv } from "node:util";

import { deploymentProblems, OFFICIAL_PROJECT_REF } from "./lib/deployment.mjs";
import { runSupabase } from "./lib/supabase.mjs";

const launch = process.argv[2] === "--launch";
if (process.argv.length > (launch ? 3 : 2)) throw new Error("Usar release:check o release:check --launch.");
const environment = { ...(existsSync(".env.remote.local") ? parseEnv(readFileSync(".env.remote.local", "utf8")) : {}), ...process.env };
if (readFileSync("supabase/.temp/project-ref", "utf8").trim() !== OFFICIAL_PROJECT_REF) throw new Error("Destino remoto no autorizado.");
const data = JSON.parse(runSupabase(["db", "query", "--linked", "--file", "supabase/checks/h8-readiness.sql", "--output", "json"]))[0]?.readiness;
if (!data) throw new Error("No se pudo comprobar el estado de publicación.");
const configuration = deploymentProblems(environment);
const launchProblems = [
  ...(!data.confirmedPayments ? ["PAYMENTS"] : []), ...(!data.activeManagers ? ["ADMINISTRATOR"] : []),
  ...(!data.locationVerified ? ["LOCATION"] : []),
  ...(data.rewardCostCents === null ? ["REWARD_COST"] : []),
  ...(environment.LOYALTY_TERMS_APPROVED !== "true" || environment.LOYALTY_PRIVACY_APPROVED !== "true" ? ["LOYALTY_DOCUMENTS"] : []),
];
const report = { checkedAt: new Date().toISOString(), projectRef: OFFICIAL_PROJECT_REF, mode: launch ? "launch" : "deployment", configurationProblems: configuration, launchProblems, readiness: data, ready: !configuration.length && (!launch || !launchProblems.length),
  limitation: "No acredita piloto, recepción WhatsApp, SMTP, contratación, revisión humana ni aprobación para activar." };
mkdirSync("docs/implementacion/evidencia/h8", { recursive: true });
writeFileSync("docs/implementacion/evidencia/h8/preflight-remoto.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ready: report.ready, configurationProblems: configuration, launchProblems }));
if (!report.ready) process.exitCode = 2;
