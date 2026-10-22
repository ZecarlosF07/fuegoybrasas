import { E2E_ORIGIN } from "../e2e/environment";
import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

import { signInStaffBrowser } from "../e2e/staff-browser";
import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "../integration/loyalty-fixture";
import { createPrivateCustomerFixture } from "../integration/private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "../integration/staff-fixture";

const completionFile = resolve(".test-fixtures/h6-manual.complete");
const readyFile = resolve(".test-fixtures/h6-manual-ready.json");
const manualPhone = "+51999000004";

// Este recorrido prepara ventanas; aprobarlo solo acredita preparación/limpieza.
// La evaluación humana se registra por separado en la guía de revisión.
test("preparar entorno local para revisión humana de H6 y restaurarlo al finalizar", async ({ browser }) => {
  mkdirSync(resolve(".test-fixtures"), { recursive: true });
  if (existsSync(completionFile)) unlinkSync(completionFile);
  if (existsSync(readyFile)) unlinkSync(readyFile);
  const settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  const program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  const occupied = await staffPool.query("select id from app_private.customers where contact_phone=$1", [manualPhone]);
  if (occupied.rowCount || settings.loyalty_enabled || program.status !== "draft") throw new Error("La preparación local anterior debe limpiarse antes de repetir la revisión.");
  const manager = await createStaffFixture("manager");
  const customerIds: string[] = [];
  try {
    await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,$3,$4,$5)",
      [testProgramId, program.revision, "fyb-loyalty-v1", JSON.stringify(testLaunchChecks), randomUUID()]);
    const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
    await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
    const customer = await createPrivateCustomerFixture();
    customerIds.push(customer.customerId);
    for (let stamp = 0; stamp < 9; stamp += 1) await actorQuery(manager, "select public.credit_stamp($1,$2,true,true)", [customer.customerId, randomUUID()]);

    const staffContext = await browser.newContext({ baseURL: E2E_ORIGIN, viewport: null });
    const staffPage = await staffContext.newPage();
    console.info("Preparando sesión de personal local con contraseña.");
    await signInStaffBrowser(staffPage, manager);
    await staffPage.goto("/personal/clientes/" + customer.customerId);
    await expect(staffPage.getByText("9 de 10 sellos", { exact: true })).toBeVisible();
    const customerContext = await browser.newContext({ baseURL: E2E_ORIGIN, viewport: null });
    const customerPage = await customerContext.newPage();
    console.info("Preparando ventana de alta local.");
    await customerPage.goto("/mi-tarjeta/acceso");
    await expect(customerPage.getByRole("heading", { name: "Crear mi tarjeta", exact: true })).toBeVisible();
    writeFileSync(readyFile, JSON.stringify({ localOnly: true, origin: E2E_ORIGIN, customerPhone: manualPhone, staffCardId: customer.cardId, ownerResult: "pending" }) + "\n");
    console.info("Ventanas locales listas: alta del cliente y ficha de personal con nueve sellos. Revisión humana pendiente.");
    while (!existsSync(completionFile)) await setTimeout(1000);
    await customerContext.close();
    await staffContext.close();
  } finally {
    const created = await staffPool.query<{ id: string }>("select id from app_private.customers where contact_phone=$1", [manualPhone]);
    await cleanupLoyaltyFixtures([], settings, program, [...customerIds, ...created.rows.map((row) => row.id)]);
    await cleanupStaffFixtures([manager]);
    await staffPool.end();
    if (existsSync(readyFile)) unlinkSync(readyFile);
    if (existsSync(completionFile)) unlinkSync(completionFile);
  }
});
