import { beforeEach, expect, it, vi } from "vitest";

import { clearCardKey, createCardKey, hashCardKey, readCardKey, saveCardKey } from "./card-session";
import { CARD_ACCESS_COOKIE, CARD_ACCESS_SECONDS } from "../constants";

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn(), site: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => mocks }));
vi.mock("@/lib/env/server", () => ({ getSiteEnvironment: mocks.site }));
beforeEach(() => { vi.resetAllMocks(); mocks.site.mockReturnValue({ APP_SITE_URL: "https://example.test" }); });

it("genera claves independientes de 256 bits y persiste solo su huella en las RPC", () => {
  const first = createCardKey(); const second = createCardKey();
  expect(first).toMatch(/^[a-f0-9]{64}$/); expect(second).not.toBe(first);
  expect(hashCardKey(first)).toMatch(/^[a-f0-9]{64}$/); expect(hashCardKey(first)).not.toBe(first);
  expect(hashCardKey(first)).toBe(hashCardKey(first));
  expect(() => hashCardKey("999000001")).toThrow();
});
it("un teléfono o cookie manipulada nunca se acepta como acceso", async () => {
  mocks.get.mockReturnValue({ value: "999000001" }); expect(await readCardKey()).toBeNull();
  mocks.get.mockReturnValue({ value: "a".repeat(64) }); expect(await readCardKey()).toBe("a".repeat(64));
  expect(mocks.get).toHaveBeenCalledWith(CARD_ACCESS_COOKIE);
});
it("protege la cookie del cliente con HttpOnly, HTTPS y SameSite", async () => {
  await saveCardKey("a".repeat(64));
  expect(mocks.set).toHaveBeenCalledWith(CARD_ACCESS_COOKIE, "a".repeat(64), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: CARD_ACCESS_SECONDS,
  });
});
it("permite HTTP de desarrollo y rechaza una clave inválida antes de escribir", async () => {
  mocks.site.mockReturnValue({ APP_SITE_URL: "http://localhost:3000" });
  await saveCardKey("b".repeat(64)); expect(mocks.set.mock.calls[0][2].secure).toBe(false);
  await expect(saveCardKey("telefono")).rejects.toThrow(); expect(mocks.set).toHaveBeenCalledOnce();
});
it("olvidar la tarjeta elimina únicamente su cookie", async () => {
  await clearCardKey(); expect(mocks.delete).toHaveBeenCalledOnce();
  expect(mocks.delete).toHaveBeenCalledWith(CARD_ACCESS_COOKIE);
});
