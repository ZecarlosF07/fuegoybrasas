import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { backupActorQuery, cleanupBackupFixture, createBackupFixture, restoreBackupFixture } from "./backup-fixture";
import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "./loyalty-fixture";
import { createPrivateCustomerFixture, readPrivateCard } from "./private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { BackupFixture } from "./types/backup-fixture";
import type { PrivateCustomerFixture } from "./types/loyalty-fixture";
import type { StaffFixture } from "./types/staff-fixture";

let manager: StaffFixture, customer: PrivateCustomerFixture, backup: BackupFixture | undefined;
let settings: Record<string, unknown>, program: Record<string, unknown>;

beforeAll(async () => {
  manager = await createStaffFixture("manager");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,'fyb-loyalty-v1',$3,$4)", [testProgramId, program.revision, JSON.stringify(testLaunchChecks), randomUUID()]);
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
  customer = await createPrivateCustomerFixture();
  for (let index = 0; index < 10; index += 1) await actorQuery(manager, "select public.credit_stamp($1,$2,true,true,$3)", [customer.customerId, randomUUID(), "BACKUP-" + index]);
});
afterAll(async () => {
  if (backup) await cleanupBackupFixture(backup);
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, [customer?.customerId].filter(Boolean));
  await cleanupStaffFixtures([manager].filter(Boolean)); await staffPool.end();
}, 40_000);

describe("H7 restauración SQL aislada", () => {
  it("restaura SQL/Auth, pausa y concilia un canje físico posterior sin duplicar premio", async () => {
    const reward = (await readPrivateCard(customer)).availableRewards[0];
    backup = await createBackupFixture();
    const operation = randomUUID();
    await actorQuery(manager, "select public.redeem_reward($1,$2,$3,true,true)", [customer.customerId, reward.id, operation]);
    expect((await readPrivateCard(customer)).availableRewards).toHaveLength(0);
    await restoreBackupFixture(backup);
    const restored = backup.pool;
    expect((await restored.query("select status from app_private.loyalty_rewards where id=$1", [reward.id])).rows[0].status).toBe("available");
    expect((await restored.query("select count(*)::int count from auth.users where id=$1", [manager.userId])).rows[0].count).toBe(1);
    expect((await restored.query("select has_function_privilege('anon','public.reinstate_reward(uuid,integer,boolean,text,uuid)','execute') allowed")).rows[0].allowed).toBe(false);
    const integrity = (await restored.query(readFileSync("supabase/checks/h7-readonly.sql", "utf8"))).rows[0];
    expect(integrity.application_tables).toBe("18");
    for (const key of ["balance_mismatches", "invalid_available_ordinals", "active_partial_invitations", "hidden_open_incidents", "hidden_protected_rewards"]) expect(integrity[key]).toBe("0");
    await restored.query("update public.business_settings set loyalty_enabled=false where id=1");
    const sql = "select public.redeem_reward($1,$2,$3,true,true) data";
    const values = [customer.customerId, reward.id, operation];
    await expect(backupActorQuery(backup, manager, sql, values)).rejects.toThrow("LOYALTY_PAUSED");
    // Operador local verifica el registro físico y habilita conciliación controlada, sin atención concurrente.
    await restored.query("update public.business_settings set loyalty_enabled=true where id=1");
    await backupActorQuery(backup, manager, sql, values);
    expect((await backupActorQuery(backup, manager, sql, values)).rows[0].data.replayed).toBe(true);
    expect((await restored.query("select net_stamps from app_private.loyalty_cards where id=$1", [customer.cardId])).rows[0].net_stamps).toBe(10);
    expect((await restored.query("select count(*)::int count from app_private.loyalty_events where card_id=$1 and event_type='reward_redeemed'", [customer.cardId])).rows[0].count).toBe(1);
    expect((await restored.query("select status from app_private.loyalty_rewards where id=$1", [reward.id])).rows[0].status).toBe("redeemed");
  }, 90_000);
});
