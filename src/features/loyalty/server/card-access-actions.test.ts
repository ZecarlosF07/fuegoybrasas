import { beforeEach, expect, it, vi } from "vitest";

import { changeCardContactAction, forgetCardAction, getPrivateCardLinkAction, openCardLinkAction, registerCardAction } from "./card-access-actions";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn(), save: vi.fn(), clear: vi.fn(), settings: vi.fn(), qr: vi.fn() }));
vi.mock("./card-session", () => ({ readCardKey: mocks.read, saveCardKey: mocks.save, clearCardKey: mocks.clear,
  createCardKey: () => "a".repeat(64), hashCardKey: () => "b".repeat(64) }));
vi.mock("./access-settings", () => ({ getCardAccessSettings: mocks.settings }));
vi.mock("@/lib/supabase/admin", () => ({ createPrivilegedSupabaseClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/env/server", () => ({ getSiteEnvironment: () => ({ APP_SITE_URL: "https://example.test" }) }));
vi.mock("qrcode", () => ({ default: { toDataURL: mocks.qr } }));
const input = { displayName: "Ana", phone: "999000001", termsVersion: "fyb-loyalty-v1", termsAccepted: true };
const card = {
  customerId: "60000000-0000-4000-8000-000000000001", cardId: "60000000-0000-4000-8000-000000000002",
  displayName: "Ana", phoneMasked: "******001", frequentInstructions: "", profileRevision: 1, cardRevision: 1,
  cardStatus: "active", programEnabled: true, progress: 0, netStamps: 0, target: 10, programLabel: "Diez visitas",
  rewardProductAvailable: true, termsVersion: "fyb-loyalty-v1", availableRewards: [], recentEvents: [],
};
beforeEach(() => {
  vi.resetAllMocks(); mocks.settings.mockReturnValue({ ready: true }); mocks.read.mockResolvedValue(null);
  mocks.rpc.mockResolvedValue({ data: card, error: null }); mocks.qr.mockResolvedValue("data:image/png;base64,fixture");
});
it("rechaza una identidad inyectada antes de crear o guardar acceso", async () => {
  const result = await registerCardAction({ ...input, customerId: card.customerId });
  expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled();
});
it("una configuración pendiente impide el alta, conservando el pedido invitado", async () => {
  mocks.settings.mockReturnValue({ ready: false });
  expect(await registerCardAction(input)).toMatchObject({ ok: false, error: { code: "CONFIG_NOT_READY" } });
  expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled();
});
it("guarda acceso antes del alta para reintentar sin otra identidad tras respuesta perdida", async () => {
  mocks.rpc.mockRejectedValueOnce(new Error("respuesta perdida"));
  expect(await registerCardAction(input)).toMatchObject({ ok: false, error: { code: "OPERATION_UNCERTAIN" } });
  expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.rpc.mock.invocationCallOrder[0]);
  mocks.read.mockResolvedValue("a".repeat(64)); expect(await registerCardAction(input)).toMatchObject({ ok: true, data: { netStamps: 0 } });
  expect(mocks.rpc).toHaveBeenLastCalledWith("ensure_card_by_key", {
    p_key_hash: "b".repeat(64), p_display_name: "Ana", p_phone: "+51999000001", p_terms_version: input.termsVersion, p_terms_accepted: true,
  });
});
it("un teléfono ocupado no devuelve información de la tarjeta existente", async () => {
  mocks.rpc.mockResolvedValue({ error: { message: "CUSTOMER_RECOVERY_REVIEW" }, data: null });
  const result = await registerCardAction(input);
  expect(result).toMatchObject({ ok: false, error: { code: "CUSTOMER_RECOVERY_REVIEW" } });
  expect(result).not.toHaveProperty("data"); expect(JSON.stringify(result)).not.toContain(card.customerId);
});
it("un teléfono no abre tarjetas y una clave desconocida no sustituye la cookie", async () => {
  expect(await openCardLinkAction(input.phone)).toMatchObject({ ok: false, error: { code: "AUTH_REQUIRED" } });
  expect(mocks.rpc).not.toHaveBeenCalled();
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "AUTH_REQUIRED" } });
  expect(await openCardLinkAction("c".repeat(64))).toMatchObject({ ok: false }); expect(mocks.save).not.toHaveBeenCalled();
});
it("valida el enlace antes de instalar su acceso y no envía la clave cruda a PostgreSQL", async () => {
  expect(await openCardLinkAction("c".repeat(64))).toMatchObject({ ok: true, data: { destination: "/mi-tarjeta" } });
  expect(mocks.rpc).toHaveBeenCalledWith("get_card_by_key", { p_key_hash: "b".repeat(64) });
  expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.save.mock.invocationCallOrder[0]);
  expect(mocks.save).toHaveBeenCalledWith("c".repeat(64));
});
it("solo genera enlace/QR tras validar el acceso actual y coloca la clave en fragmento", async () => {
  expect(await getPrivateCardLinkAction()).toMatchObject({ ok: false, error: { code: "AUTH_REQUIRED" } }); expect(mocks.qr).not.toHaveBeenCalled();
  mocks.read.mockResolvedValue("a".repeat(64)); const result = await getPrivateCardLinkAction();
  expect(result).toMatchObject({ ok: true, data: { link: "https://example.test/mi-tarjeta/acceso#tarjeta=" + "a".repeat(64) } });
  expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.qr.mock.invocationCallOrder[0]);
});
it("cambia contacto únicamente desde la cookie y con revisión, sin aceptar UUID libres", async () => {
  expect(await changeCardContactAction({ phone: input.phone, expectedRevision: 1 })).toMatchObject({ ok: false, error: { code: "AUTH_REQUIRED" } });
  mocks.read.mockResolvedValue("a".repeat(64));
  expect(await changeCardContactAction({ phone: input.phone, expectedRevision: 1, customerId: card.customerId })).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  expect(await changeCardContactAction({ phone: input.phone, expectedRevision: 1 })).toMatchObject({ ok: true });
  expect(mocks.rpc).toHaveBeenCalledWith("update_card_phone_by_key", { p_key_hash: "b".repeat(64), p_phone: "+51999000001", p_expected_revision: 1 });
});
it("olvidar el acceso no invoca Auth ni modifica tarjeta o progreso", async () => {
  expect(await forgetCardAction()).toMatchObject({ ok: true }); expect(mocks.clear).toHaveBeenCalledOnce();
  expect(mocks.rpc).not.toHaveBeenCalled();
});
