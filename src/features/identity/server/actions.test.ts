import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { requestPasswordRecoveryAction, signInStaffAction } from "./actions";

const mocks = vi.hoisted(() => ({ login: vi.fn(), recovery: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: () => ({
  auth: { signInWithPassword: mocks.login, resetPasswordForEmail: mocks.recovery }, rpc: mocks.rpc,
}) }));
vi.mock("@/lib/env/server", () => ({ getSiteEnvironment: () => ({ APP_SITE_URL: "https://production.example.test" }) }));
const credentials = { email: "staff@example.test", password: "Synthetic-password-123" };
const access = { id: "00000000-0000-4000-8000-000000000001", authUserId: "00000000-0000-4000-8000-000000000002", role: "attendant", revision: 1, assuranceLevel: "aal1" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.login.mockResolvedValue({ error: null }); mocks.recovery.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: access, error: null });
});
afterEach(() => vi.unstubAllEnvs());

it("accede en origen HTTPS sin variables o token CAPTCHA y conserva MFA", async () => {
  vi.stubEnv("AUTH_CAPTCHA_PROVIDER", ""); vi.stubEnv("NEXT_PUBLIC_CAPTCHA_SITE_KEY", "");
  expect(await signInStaffAction(credentials)).toMatchObject({ ok: true, data: { destination: "/personal/mfa" } });
  expect(mocks.login).toHaveBeenCalledWith(credentials);
  expect(mocks.rpc).toHaveBeenCalledWith("get_staff_access");
});
it("una sesión AAL2 autorizada continúa al personal sin cambiar su rol", async () => {
  mocks.rpc.mockResolvedValue({ data: { ...access, assuranceLevel: "aal2" }, error: null });
  expect(await signInStaffAction(credentials)).toMatchObject({ ok: true, data: { destination: "/personal" } });
});
it("una cuenta sin permiso actual sigue denegada tras retirar CAPTCHA", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "FORBIDDEN" } });
  expect(await signInStaffAction(credentials)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
});
it("rechaza campos inyectados antes de invocar Auth", async () => {
  expect(await signInStaffAction({ ...credentials, role: "manager" })).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  expect(mocks.login).not.toHaveBeenCalled();
});
it("recuperación usa correo y callback fijo sin token adicional", async () => {
  expect(await requestPasswordRecoveryAction({ email: credentials.email })).toMatchObject({ ok: true });
  expect(mocks.recovery).toHaveBeenCalledWith(credentials.email, { redirectTo: "https://production.example.test/auth/confirm" });
});
it("los límites del proveedor continúan mostrándose como error explícito", async () => {
  mocks.login.mockResolvedValue({ error: { status: 429 } });
  expect(await signInStaffAction(credentials)).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
