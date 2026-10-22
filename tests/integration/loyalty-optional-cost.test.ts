import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, readPrivateCard } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";
import type { StaffFixture } from "./types/staff-fixture";

let manager: StaffFixture, attendant: StaffFixture, customer: PrivateCustomerFixture;
let settings: Record<string, unknown>, program: Record<string, unknown>;

beforeAll(async () => {
  manager = await createStaffFixture("manager");
  attendant = await createStaffFixture("attendant", manager.staffId ?? undefined);
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program(p_program_id=>$1,p_expected_revision=>$2,p_terms_version=>'fyb-loyalty-v1',p_checks=>$3,p_operation_id=>$4)", [testProgramId, program.revision, JSON.stringify(testLaunchChecks), randomUUID()]);
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
  customer = await createPrivateCustomerFixture();
});

afterAll(async () => {
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, customer ? [customer.customerId] : []);
  await cleanupStaffFixtures([manager, attendant].filter(Boolean));
  await staffPool.end();
});

async function revision() {
  return (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
}

async function earnAndRedeem() {
  for (let stamp = 0; stamp < 10; stamp++) await actorQuery(attendant, "select public.credit_stamp($1,$2,true,true)", [customer.customerId, randomUUID()]);
  const reward = (await readPrivateCard(customer)).availableRewards[0];
  await actorQuery(attendant, "select public.redeem_reward($1,$2,$3,true,true)", [customer.customerId, reward.id, randomUUID()]);
  return reward.id;
}

it("activa sin costo, conserva NULL y permite crear una tarjeta sin SMS", async () => {
  expect((await staffPool.query("select status,reward_cost_cents from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0]).toEqual({ status: "active", reward_cost_cents: null });
  expect((await readPrivateCard(customer)).netStamps).toBe(0);
  await expect(actorQuery(attendant, "select public.update_reward_cost($1,$2,700,$3)", [testProgramId, await revision(), randomUUID()])).rejects.toMatchObject({ message: "FORBIDDEN" });
});

it("diez sellos permiten un canje con costo desconocido, sin escribir cero", async () => {
  const rewardId = await earnAndRedeem();
  expect((await staffPool.query("select reward_cost_cents_snapshot cost from app_private.loyalty_events where reward_id=$1 and event_type='reward_redeemed'", [rewardId])).rows[0].cost).toBeNull();
  expect((await readPrivateCard(customer)).availableRewards).toHaveLength(0);
  expect((await readPrivateCard(customer)).netStamps).toBe(10);
});

it("registrar y retirar el costo de referencia no altera canjes anteriores", async () => {
  await expect(actorQuery(manager, "select public.update_reward_cost($1,$2,-1,$3)", [testProgramId, await revision(), randomUUID()])).rejects.toMatchObject({ message: "VALIDATION_ERROR" });
  await actorQuery(manager, "select public.update_reward_cost($1,$2,700,$3)", [testProgramId, await revision(), randomUUID()]);
  await earnAndRedeem();
  await actorQuery(manager, "select public.update_reward_cost(p_program_id=>$1,p_expected_revision=>$2,p_operation_id=>$3)", [testProgramId, await revision(), randomUUID()]);
  const costs = (await staffPool.query("select reward_cost_cents_snapshot cost from app_private.loyalty_events where card_id=$1 and event_type='reward_redeemed' order by recorded_at,id", [customer.cardId])).rows.map(row => row.cost);
  expect(costs).toEqual([null, 700]);
  expect((await staffPool.query("select reward_cost_cents cost from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].cost).toBeNull();
});
