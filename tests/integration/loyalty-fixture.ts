import { staffAdmin, staffPool } from "./staff-fixture";

export const testProgramId = "f6000000-0000-4000-8000-000000000001";
export const testLaunchChecks = { costConfirmed: true, termsApproved: true, privacyApproved: true, accessTested: true, staffReady: true };
export async function cleanupLoyaltyFixtures(authIds: string[], settings: Record<string, unknown>, program: Record<string, unknown>, customerIds: string[] = []) {
  const client = await staffPool.connect();
  try {
    await client.query("begin");
    // Pool protegido: solo localhost. Excepción del operador restringida a UUID sintéticos propios.
    await client.query("set local session_replication_role='replica'");
    const cards = (await client.query("select c.id from app_private.loyalty_cards c join app_private.customers u on u.id=c.customer_id where u.auth_user_id=any($1::uuid[]) or u.id=any($2::uuid[])", [authIds, customerIds])).rows.map((row) => row.id);
    for (const table of ["loyalty_incidents", "loyalty_rewards", "loyalty_events"]) await client.query("delete from app_private." + table + " where card_id=any($1::uuid[])", [cards]);
    await client.query("delete from app_private.loyalty_cards where id=any($1::uuid[])", [cards]);
    await client.query("delete from app_private.customers where auth_user_id=any($1::uuid[]) or id=any($2::uuid[])", [authIds, customerIds]);
    await client.query("delete from app_private.audit_entries where actor_user_id=any($1::uuid[])", [[...authIds, ...customerIds]]);
    await client.query("update public.business_settings set loyalty_enabled=$1,revision=$2,updated_at=$3 where id=1", [settings.loyalty_enabled, settings.revision, settings.updated_at]);
    await client.query("update app_private.loyalty_program_versions set status=$1,reward_cost_cents=$2,reward_available=$3,revision=$4,updated_at=$5 where id=$6", [program.status, program.reward_cost_cents, program.reward_available, program.revision, program.updated_at, testProgramId]);
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  for (const id of authIds) { const removed = await staffAdmin.deleteUser(id); if (removed.error) throw new Error("No se pudo limpiar Auth sintético."); }
}
