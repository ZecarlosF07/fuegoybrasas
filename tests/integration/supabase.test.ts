import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getPublicEnvironment } from "@/lib/env/public";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createRequestSupabaseClient } from "@/lib/supabase/server";

import { createSessionStore } from "./session-store";
import type { TestIdentity } from "./types/session";

const identities: TestIdentity[] = [];

beforeAll(async () => {
  const url = new URL(getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL);
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Integración permitida solo en Supabase local.");
  const admin = createAdminAuthClient();
  for (let index = 0; index < 2; index += 1) {
    const email = `h1-${crypto.randomUUID()}@example.invalid`;
    const password = `${crypto.randomUUID()}A9!`;
    const { data, error } = await admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error("No se pudo preparar una identidad Auth sintética local.");
    identities.push({ id: data.user.id, email, password });
  }
});

afterAll(async () => {
  if (identities.length === 0) return;
  const admin = createAdminAuthClient();
  for (const identity of identities) {
    const { error } = await admin.deleteUser(identity.id);
    if (error) throw new Error("No se pudo limpiar una identidad Auth sintética local.");
  }
});

describe("Supabase local real", () => {
  it("comprueba comunicación SDK y denegación de una identidad inválida", async () => {
    const client = createPublicSupabaseClient();
    const { error } = await client.auth.getUser("synthetic-invalid-token");
    expect(error?.status).toBe(403);
    const anonymous = await client.auth.getUser();
    expect(anonymous.error?.name).toBe("AuthSessionMissingError");
  });

  it("aísla sesiones SSR por petición y renueva la lectura mediante cookies", async () => {
    const first = identities[0];
    const second = identities[1];
    if (!first || !second) throw new Error("Identidades sintéticas incompletas.");
    const firstStore = createSessionStore();
    const secondStore = createSessionStore();
    const firstClient = createRequestSupabaseClient(firstStore.adapter);
    const secondClient = createRequestSupabaseClient(secondStore.adapter);
    const firstLogin = await firstClient.auth.signInWithPassword(first);
    const secondLogin = await secondClient.auth.signInWithPassword(second);
    expect(firstLogin.error).toBeNull();
    expect(secondLogin.error).toBeNull();
    const firstRequest = await createRequestSupabaseClient(firstStore.adapter).auth.getUser();
    const secondRequest = await createRequestSupabaseClient(secondStore.adapter).auth.getUser();
    expect(firstRequest.data.user?.id === first.id).toBe(true);
    expect(secondRequest.data.user?.id === second.id).toBe(true);
    expect(firstStore.cookies.size).toBeGreaterThan(0);
    expect(secondStore.cookies.size).toBeGreaterThan(0);
    expect(firstStore.headers.get("cache-control")).toContain("no-store");
    const anonymous = await createPublicSupabaseClient().auth.getUser();
    expect(anonymous.data.user).toBeNull();
    const loggedOut = await firstClient.auth.signOut();
    expect(loggedOut.error).toBeNull();
    const stillSecond = await secondClient.auth.getUser();
    expect(stillSecond.data.user?.id === second.id).toBe(true);
  });

  it("fábrica administrativa solo expone la API administrativa de Auth", () => {
    const admin = createAdminAuthClient();
    expect(admin).not.toHaveProperty("from");
    expect(admin).not.toHaveProperty("rpc");
  });
});
