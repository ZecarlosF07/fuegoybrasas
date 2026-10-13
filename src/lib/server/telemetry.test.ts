import { afterEach, describe, expect, it, vi } from "vitest";

import { runServerWork } from "./results";
import { writeServerEvent } from "./telemetry";
import { success } from "@/contracts/services/result";

const ignoreLog = () => undefined;
async function failedWork(): Promise<never> { throw new Error("correo@example.test sb_secret_no_publicar #tarjeta=privada"); }
async function successfulWork(requestId: string) { return success({ saved: true }, requestId); }

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("Diagnóstico sin datos personales", () => {
  it("registra resultado, código y latencia sin copiar el error o payload", async () => {
    vi.stubEnv("APP_TELEMETRY_ENABLED", "true"); const output = vi.spyOn(console, "info").mockImplementation(ignoreLog);
    const result = await runServerWork(failedWork, true);
    expect(result.ok).toBe(false); const record = JSON.parse(String(output.mock.calls[0][0]));
    expect(record.outcome).toBe("uncertain"); expect(record.code).toBe("OPERATION_UNCERTAIN");
    expect(record.durationMs).toBeGreaterThanOrEqual(0); expect(record.requestId).toBe(result.requestId);
    expect(JSON.stringify(record)).not.toMatch(/example|sb_secret|tarjeta|payload|stack/);
  });
  it("respeta la desactivación y conserva el resultado de negocio", async () => {
    vi.stubEnv("APP_TELEMETRY_ENABLED", "false"); const output = vi.spyOn(console, "info").mockImplementation(ignoreLog);
    const result = await runServerWork(successfulWork);
    expect(result.ok).toBe(true); expect(output).not.toHaveBeenCalled();
  });
  it("rechaza entradas inesperadas en ejecución sin copiarlas al log", () => {
    vi.stubEnv("APP_TELEMETRY_ENABLED", "true"); const output = vi.spyOn(console, "error").mockImplementation(ignoreLog);
    const extra = { requestId: "00000000-0000-4000-8000-000000000001", operation: "server.work", outcome: "success", durationMs: 1, email: "private@example.test" };
    // Simula un consumidor JS sin tipos: la allowlist también protege en ejecución.
    writeServerEvent(JSON.parse(JSON.stringify(extra)));
    expect(String(output.mock.calls[0][0])).toContain("telemetry_invalid");
    expect(String(output.mock.calls[0][0])).not.toContain("private@example.test");
  });
});
