import { afterEach, describe, expect, it, vi } from "vitest";

import { readCatalog } from "./read";
import { catalogFixture } from "../tests/fixtures";

const mocks = vi.hoisted(() => ({ abortSignal: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/public", () => ({ createPublicSupabaseClient: () => ({ rpc: mocks.rpc }) }));
afterEach(() => vi.restoreAllMocks());

describe("DAL de catálogo sin sesión", () => {
  it("entrega snapshot validado y acota la consulta", async () => {
    mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.abortSignal.mockResolvedValue({ data: catalogFixture, error: null });
    const result = await readCatalog();
    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("read_catalog");
    expect(mocks.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
  it("distingue falta de configuración y error de conexión sin mostrar SQL", async () => {
    mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.abortSignal.mockResolvedValue({ data: null, error: null });
    expect(await readCatalog()).toMatchObject({ ok: false, error: { code: "CONFIG_NOT_READY" } });
    mocks.abortSignal.mockResolvedValue({ data: null, error: { message: "SQL privado" } });
    expect(await readCatalog()).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE" } });
    mocks.abortSignal.mockRejectedValue(new Error("Detalles internos"));
    expect(JSON.stringify(await readCatalog())).not.toContain("Detalles internos");
  });
  it("rechaza DTO alterado y registra solo categoría de error e identificador", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(vi.fn());
    mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.abortSignal.mockResolvedValue({ data: { ...catalogFixture, secreto: "Nunca exponer" }, error: null });
    expect(await readCatalog()).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE" } });
    expect(log).toHaveBeenCalledWith("CATALOG_INVALID_RESPONSE", expect.any(String));
  });
});
