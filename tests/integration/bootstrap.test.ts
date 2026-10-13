import { spawnSync } from "node:child_process";
import { afterAll, expect, it } from "vitest";

import { cleanupStaffFixtures, createStaffFixture, staffPool } from "./staff-fixture";
import type { StaffFixture } from "./types/staff-fixture";

const fixtures: StaffFixture[] = [];
afterAll(async () => { await cleanupStaffFixtures(fixtures); await staffPool.end(); });
it("bootstrap operado localmente crea y audita exactamente el primer responsable", async () => {
  const fixture = await createStaffFixture(null); fixtures.push(fixture);
  const bootstrap = spawnSync(process.execPath, ["scripts/bootstrap-staff.mjs", fixture.userId], { encoding: "utf8", timeout: 15000 });
  expect(bootstrap.status).toBe(0);
  const staff = await staffPool.query("select id,role,active,created_by from app_private.staff_accounts where auth_user_id=$1", [fixture.userId]);
  expect(staff.rows[0]).toMatchObject({ role: "manager", active: true, created_by: null });
  expect((await staffPool.query("select count(*)::int total from app_private.audit_entries where actor_user_id=$1 and action='bootstrap_staff'", [fixture.userId])).rows[0].total).toBe(1);
  const duplicate = spawnSync(process.execPath, ["scripts/bootstrap-staff.mjs", fixture.userId], { encoding: "utf8", timeout: 15000 });
  expect(duplicate.status).toBe(1);
});
