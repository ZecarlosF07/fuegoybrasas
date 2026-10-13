import { randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, privateCardQuery } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffAdmin, staffPool } from "./staff-fixture";
import type { CustomerFixture } from "./types/loyalty-fixture";
import type { StaffFixture } from "./types/staff-fixture";

let manager: StaffFixture;
let customer: CustomerFixture;
let settings: Record<string, unknown>, program: Record<string, unknown>;
const authIds: string[] = [];

beforeAll(async () => {
  manager = await createStaffFixture("manager");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,$3,$4,$5)",
    [testProgramId, program.revision, "fyb-loyalty-v1", JSON.stringify(testLaunchChecks), randomUUID()]);
  const phone = "+519" + randomInt(10000000, 99999999);
  const created = await staffAdmin.createUser({ phone, phone_confirm: true });
  if (created.error || !created.data.user) throw new Error("No se pudo preparar la identidad antigua sintética.");
  const userId = created.data.user.id;
  authIds.push(userId);
  const response = await actorQuery({ userId }, "select public.ensure_customer_profile('Compatibilidad antigua','fyb-loyalty-v1',true) data");
  customer = { userId, phone, customerId: response.rows[0].data.customerId, cardId: response.rows[0].data.cardId };
});

afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures(authIds, settings, program);
  if (manager) await cleanupStaffFixtures([manager]);
  await staffPool.end();
});

it("compatibilidad: la identidad Auth anterior conserva su tarjeta y replay", async () => {
  const replay = await actorQuery(customer, "select public.ensure_customer_profile('Compatibilidad antigua','fyb-loyalty-v1',true) data");
  expect(replay.rows[0].data).toMatchObject({ customerId: customer.customerId, cardId: customer.cardId, netStamps: 0 });
  expect((await actorQuery(customer, "select public.get_my_card() data")).rows[0].data.cardId).toBe(customer.cardId);
});

it("compatibilidad: un alta por clave no absorbe el teléfono de una identidad anterior", async () => {
  const identity = await createPrivateCustomerFixture(false);
  await expect(privateCardQuery("select public.ensure_card_by_key($1,'Otro cliente',$2,'fyb-loyalty-v1',true)",
    [identity.keyHash, customer.phone])).rejects.toMatchObject({ message: "CUSTOMER_RECOVERY_REVIEW" });
  expect((await staffPool.query("select count(*)::int n from app_private.customers where access_key_hash=$1", [identity.keyHash])).rows[0].n).toBe(0);
});

it("compatibilidad: búsqueda del personal sigue el teléfono confirmado antiguo actualizado", async () => {
  const next = "+519" + randomInt(10000000, 99999999);
  const changed = await staffAdmin.updateUserById(customer.userId, { phone: next, phone_confirm: true });
  expect(changed.error).toBeNull();
  expect((await actorQuery(manager, "select public.lookup_customer($1) data", [customer.phone])).rows[0].data.found).toBe(false);
  expect((await actorQuery(manager, "select public.lookup_customer($1) data", [next])).rows[0].data.card.cardId).toBe(customer.cardId);
});
