import { expect, it } from "vitest";

import { publicEnvironmentSchema, secretKeySchema, siteEnvironmentSchema } from "./schemas";
import { parseEnvironment } from "./utils";

const validInput = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_h1_value",
};
const legacyKey = (role: string) => `eyJheader.${btoa(JSON.stringify({ role }))}.signature`;

it("acepta configuración pública local", () => {
  expect(parseEnvironment(publicEnvironmentSchema, validInput)).toEqual(validInput);
});
it("informa los nombres ausentes sin datos sensibles", () => {
  expect(() => parseEnvironment(publicEnvironmentSchema, {})).toThrow("NEXT_PUBLIC_SUPABASE_URL");
});
it.each(["sb_secret_synthetic_h1_value", legacyKey("service_role"), "replace-with-local-publishable-key"])("rechaza claves privilegiadas/placeholders", (key) => {
  expect(() => parseEnvironment(publicEnvironmentSchema, { ...validInput, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key })).toThrow("Configuración inválida");
});
it("acepta anon legado sin confundirlo con service_role", () => {
  expect(publicEnvironmentSchema.safeParse({ ...validInput, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyKey("anon") }).success).toBe(true);
});
it("la excepción no revela el valor incorrecto", () => {
  const key = "sb_secret_synthetic_h1_value";
  try {
    parseEnvironment(publicEnvironmentSchema, { ...validInput, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    expect.fail("Debió rechazar la clave");
  } catch (error) {
    expect(String(error)).not.toContain(key);
  }
});
it.each(["ftp://localhost", "no-url", "javascript:alert(1)"])("solo permite HTTP(S)", (url) => {
  expect(siteEnvironmentSchema.safeParse({ APP_SITE_URL: url }).success).toBe(false);
});
it("no acepta una clave pública como secreta", () => {
  expect(secretKeySchema.safeParse(validInput.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).success).toBe(false);
});
