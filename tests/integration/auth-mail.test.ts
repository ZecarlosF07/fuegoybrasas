import { afterAll, expect, it } from "vitest";

import { cleanupStaffFixtures, createStaffFixture, staffPool, testAuthClient } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";

const fixtures: StaffFixture[] = [];
afterAll(async () => { await cleanupStaffFixtures(fixtures); await staffPool.end(); });
it("correo local de recuperación usa token_hash y callback fijo en la plantilla real", async () => {
  const fixture = await createStaffFixture("manager"); fixtures.push(fixture);
  const sent = await testAuthClient().auth.resetPasswordForEmail(fixture.email, { redirectTo: "http://127.0.0.1:3100/auth/confirm" });
  expect(sent.error).toBeNull();
  const inbox = await fetch("http://127.0.0.1:54324/api/v1/messages").then((response) => response.json());
  const found = inbox.messages.find((message: { To: { Address: string }[] }) => message.To.some((recipient) => recipient.Address === fixture.email));
  expect(Boolean(found)).toBe(true);
  if (!found) throw new Error("Correo sintético no encontrado.");
  const message = await fetch(`http://127.0.0.1:54324/api/v1/message/${encodeURIComponent(found.ID)}`).then((response) => response.json());
  expect(Boolean(message.HTML.includes("http://127.0.0.1:3100/auth/confirm?token_hash=") && message.HTML.includes("type=recovery"))).toBe(true);
});
