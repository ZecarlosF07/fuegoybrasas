import { beforeEach, expect, it, vi } from "vitest";

import { getCardAccessSettings } from "./access-settings";

const mocks = vi.hoisted(() => ({ environment: vi.fn(), secret: vi.fn() }));
vi.mock("@/lib/env/public", () => ({ getPublicEnvironment: mocks.environment }));
vi.mock("@/lib/env/server", () => ({ getSecretKey: mocks.secret }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.environment.mockReturnValue({ NEXT_PUBLIC_SUPABASE_URL: "https://geazxsvjkqpzbghlywbw.supabase.co" });
  mocks.secret.mockReturnValue("synthetic-server-key");
});

it("reconoce la aprobación versionada aunque el hosting conserve indicadores antiguos", () => {
  vi.stubEnv("LOYALTY_TERMS_APPROVED", "false");
  vi.stubEnv("LOYALTY_PRIVACY_APPROVED", "false");
  try { expect(getCardAccessSettings().ready).toBe(true); }
  finally { vi.unstubAllEnvs(); }
});

it("la aprobación no permite usar tarjeta si falta la clave privada del servidor", () => {
  mocks.secret.mockImplementation(() => { throw new Error("Configuración incompleta"); });
  expect(getCardAccessSettings().ready).toBe(false);
});
