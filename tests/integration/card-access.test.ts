import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { privateCardQuery } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";
import { cardSchema } from "@/features/loyalty/validation/dto";

let manager: StaffFixture | undefined;
let settings: Record<string, unknown>, program: Record<string, unknown>;
const customerIds: string[] = [];
const firstHash = createHash("sha256").update(randomBytes(32)).digest("hex");
const phone = "+519" + randomInt(10000000, 99999999);
const serverQuery = privateCardQuery;
async function readCard() {
  return cardSchema.parse((await serverQuery("select public.get_card_by_key($1) data", [firstHash])).rows[0].data);
}
beforeAll(async () => {
  manager = await createStaffFixture("manager");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,$3,$4,$5)",
    [testProgramId, program.revision, "fyb-loyalty-v1", JSON.stringify(testLaunchChecks), randomUUID()]);
});
afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, customerIds);
  if (manager) await cleanupStaffFixtures([manager]); await staffPool.end();
});
it("alta por clave concurrente crea una sola tarjeta sin Auth ni sellos", async () => {
  const responses = await Promise.all([1, 2].map(() => serverQuery("select public.ensure_card_by_key($1,'Cliente sintético',$2,'fyb-loyalty-v1',true) data", [firstHash, phone])));
  const first = cardSchema.parse(responses[0].rows[0].data); customerIds.push(first.customerId);
  expect(cardSchema.parse(responses[1].rows[0].data).cardId).toBe(first.cardId); expect(first.netStamps).toBe(0);
  expect((await staffPool.query("select auth_user_id from app_private.customers where id=$1", [first.customerId])).rows[0].auth_user_id).toBeNull();
});
it("el mismo teléfono con otra clave no abre ni duplica la tarjeta", async () => {
  const otherHash = createHash("sha256").update(randomBytes(32)).digest("hex");
  await expect(serverQuery("select public.ensure_card_by_key($1,'Otro cliente',$2,'fyb-loyalty-v1',true)", [otherHash, phone])).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
  await expect(serverQuery("select public.get_card_by_key($1)", [otherHash])).rejects.toMatchObject({ message: "AUTH_REQUIRED" });
  expect((await staffPool.query("select count(*)::int n from app_private.customers where contact_phone=$1", [phone])).rows[0].n).toBe(1);
});
it("un JWT de cliente no ejecuta funciones privadas por hash", async () => {
  await expect(actorQuery({ userId: randomUUID() }, "select public.get_card_by_key($1)", [firstHash])).rejects.toMatchObject({ code: "42501" });
});
it("editar indicaciones y contacto conserva tarjeta, progreso y clave", async () => {
  const original = await readCard();
  const updated = cardSchema.parse((await serverQuery("select public.update_card_profile_by_key($1,'Nombre sintético','Sin ají',$2) data", [firstHash, original.profileRevision])).rows[0].data);
  const nextPhone = "+519" + randomInt(10000000, 99999999);
  const contact = cardSchema.parse((await serverQuery("select public.update_card_phone_by_key($1,$2,$3) data", [firstHash, nextPhone, updated.profileRevision])).rows[0].data);
  expect(contact).toMatchObject({ customerId: original.customerId, cardId: original.cardId, netStamps: original.netStamps, frequentInstructions: "Sin ají" });
  expect(JSON.stringify(contact)).not.toContain(firstHash);
  await expect(serverQuery("select public.update_card_phone_by_key($1,$2,$3)", [firstHash, phone, original.profileRevision])).rejects.toMatchObject({ message: "CONFLICT" });
});
it("una clave vencida no altera ni borra los derechos de la tarjeta", async () => {
  const original = await readCard();
  await staffPool.query("update app_private.customers set access_key_expires_at=now()-interval '1 second' where id=$1", [original.customerId]);
  await expect(readCard()).rejects.toMatchObject({ message: "AUTH_REQUIRED" });
  expect((await staffPool.query("select net_stamps from app_private.loyalty_cards where id=$1", [original.cardId])).rows[0].net_stamps).toBe(original.netStamps);
});
