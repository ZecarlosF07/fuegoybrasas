import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { signInStaffBrowser } from "./staff-browser";
import { E2E_ORIGIN } from "./environment";
import { evidenceDirectory } from "./evidence";
import { cleanupLoyaltyFixtures, testLaunchChecks, testProgramId } from "../integration/loyalty-fixture";
import { createPrivateCustomerFixture } from "../integration/private-card-fixture";
import { actorQuery, cleanupStaffFixtures, createStaffFixture, staffPool } from "../integration/staff-fixture";
import type { PrivateCustomerFixture } from "../integration/types/loyalty-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

test.describe.configure({ mode: "serial", timeout: 90_000 });
test.use({ trace: "off" });
const captures = evidenceDirectory("h7/capturas");
let manager: StaffFixture, attendant: StaffFixture, near: PrivateCustomerFixture, ready: PrivateCustomerFixture;
let cookies: Awaited<ReturnType<BrowserContext["cookies"]>>, settings: Record<string, unknown>, program: Record<string, unknown>;
const invited: StaffFixture[] = [];
const invitationEmail = `h7-browser-${randomUUID()}@example.test`;
test.beforeAll(async ({ browser }) => {
  manager = await createStaffFixture("manager"); attendant = await createStaffFixture("attendant");
  settings = (await staffPool.query("select * from public.business_settings where id=1")).rows[0];
  program = (await staffPool.query("select * from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0];
  await actorQuery(manager, "select public.activate_loyalty_program($1,$2,650,'fyb-loyalty-v1',$3,$4)", [testProgramId, program.revision, JSON.stringify(testLaunchChecks), randomUUID()]);
  near = await createPrivateCustomerFixture(); ready = await createPrivateCustomerFixture();
  for (const [customer, stamps] of [[near, 8], [ready, 10]] as const) for (let index = 0; index < stamps; index += 1) await actorQuery(manager, "select public.credit_stamp($1,$2,true,true,$3)", [customer.customerId, randomUUID(), "H7-VISITA-" + index]);
  const context = await browser.newContext({ baseURL: E2E_ORIGIN });
  await signInStaffBrowser(await context.newPage(), manager); cookies = await context.cookies(); await context.close();
});
test.afterAll(async () => {
  const rows = (await staffPool.query("select s.id,s.auth_user_id from app_private.staff_accounts s join auth.users u on u.id=s.auth_user_id where u.email=$1", [invitationEmail])).rows;
  for (const row of rows) invited.push({ userId: row.auth_user_id, staffId: row.id, email: invitationEmail, password: "" });
  if (settings && program) await cleanupLoyaltyFixtures([], settings, program, [near?.customerId, ready?.customerId].filter(Boolean));
  await cleanupStaffFixtures([manager, attendant, ...invited].filter(Boolean)); await staffPool.end();
});
async function layout(page: Page, name: string) {
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${captures}/${name}-${width}.png`, fullPage: true });
  }
}
test("resumen, filtros y menú móvil distinguen progreso y premio; accesible", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion");
  await expect(page.getByRole("heading", { name: "Resumen de fidelización" })).toBeVisible();
  await expect(page.getByText("0 de 10 sellos · Premios pendientes: 1", { exact: true })).toBeVisible();
  await layout(page, "resumen");
  await page.getByLabel("Mostrar clientes").selectOption("near_reward"); await page.getByRole("button", { name: "Consultar clientes", exact: true }).click();
  await expect(page.getByText("8 de 10 sellos · Premios pendientes: 0", { exact: true })).toBeVisible();
  await expect(page.getByText("0 de 10 sellos · Premios pendientes: 1", { exact: true })).toHaveCount(0);
  await page.getByLabel("Desde", { exact: true }).fill("2026-10-11"); await page.getByLabel("Hasta (inclusive)").fill("2025-10-11");
  await page.getByRole("button", { name: "Consultar actividad", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toBeFocused();
  await expect(page.getByText("Selecciona un periodo válido de hasta 366 días.", { exact: true }).first()).toBeVisible();
  const toggle = page.getByRole("button", { name: "Abrir menú del panel", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  const navigation = page.getByRole("navigation", { name: "Navegación del personal" });
  await expect(navigation.getByRole("link")).toHaveCount(6);
  await navigation.getByRole("link", { name: "Resumen de fidelización", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await navigation.getByRole("link", { name: "Incidencias", exact: true }).click();
  await expect(page).toHaveURL(/\/administracion\/incidencias$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
test("corrección y reversión de décimo sello muestran estado real y conservan historia", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/clientes/" + ready.customerId);
  await page.getByLabel("Nombre solicitado").fill("Cliente corregido H7"); await page.getByLabel("Indicaciones habituales solicitadas").fill("Ají aparte sintético");
  await page.getByLabel("Motivo de la corrección").fill("Nombre corregido por solicitud expresa");
  await page.getByLabel("El cliente solicitó expresamente esta corrección").check();
  await page.getByRole("button", { name: "Guardar corrección solicitada", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Supervisar tarjeta de Cliente corregido H7" })).toBeVisible();
  const eventId = (await staffPool.query("select id from app_private.loyalty_events where card_id=$1 and event_type='stamp_credited' order by recorded_at desc,id desc limit 1", [ready.cardId])).rows[0].id;
  await page.getByLabel("Sello original").selectOption(eventId); await page.getByLabel("Motivo de la reversión").fill("Décima visita registrada por error");
  await page.getByRole("button", { name: "Confirmar reversión de un sello" }).click();
  await expect(page.getByText("9 de 10 sellos", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premios disponibles · 0" })).toBeVisible();
  await expect(page.getByText("Sello corregido", { exact: true }).first()).toBeVisible();
  await layout(page, "historial-correccion");
});
test("incidencia cerrada se retira/restaura sin cambio de saldo", async ({ page, context }) => {
  const opened = (await actorQuery(manager, "select public.open_incident($1,'other','Consulta administrativa sintética H7',$2) data", [near.customerId, randomUUID()])).rows[0].data;
  await context.addCookies(cookies); await page.goto("/administracion/incidencias");
  await page.getByRole("button", { name: "Revisar incidencia", exact: true }).click();
  await page.getByLabel("Nota de resolución (sin cambio de saldo)").fill("Consulta aclarada sin modificar el progreso");
  await page.getByRole("button", { name: "Cerrar incidencia sin cambiar saldo" }).click();
  await expect(page.getByText("No hay incidencias para este filtro.")).toBeVisible();
  await page.getByLabel("Estado de las incidencias").selectOption("closed"); await page.getByRole("button", { name: "Consultar incidencias", exact: true }).click();
  await page.getByRole("button", { name: "Revisar incidencia", exact: true }).click();
  await page.getByLabel("Motivo de retiro o restauración").fill("Archivar consulta ya resuelta"); await page.getByRole("button", { name: "Retirar incidencia cerrada" }).click();
  await page.getByLabel("Motivo de retiro o restauración").fill("Restaurar consulta para revisión histórica"); await page.getByRole("button", { name: "Restaurar incidencia cerrada" }).click();
  await expect(page.getByText("Estado: Cerrada", { exact: true })).toBeVisible();
  expect((await staffPool.query("select net_stamps from app_private.loyalty_cards where id=$1", [near.cardId])).rows[0].net_stamps).toBe(8);
  expect((await staffPool.query("select status,deleted_at from app_private.loyalty_incidents where id=$1", [opened.incidentId])).rows[0]).toEqual({ status: "closed", deleted_at: null });
  await layout(page, "incidencias");
});
test("invita mediante Auth local y revoca/restaura acceso sin reactivar", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/personal");
  await page.getByLabel("Correo del empleado").fill(invitationEmail); await page.getByRole("button", { name: "Enviar invitación", exact: true }).click();
  await expect(page.getByText("Invitación enviada y acceso asignado. El empleado debe definir su contraseña.", { exact: true })).toBeVisible();
  const employee = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: invitationEmail, exact: true }) });
  await employee.getByRole("button", { name: "Administrar permisos" }).click();
  await page.getByLabel("Motivo del retiro o restauración").fill("Retirar permiso por prueba de operación"); await page.getByRole("button", { name: "Retirar acceso de esta cuenta" }).click();
  await page.getByLabel("Motivo del retiro o restauración").fill("Restaurar cuenta sin autorizarla todavía"); await page.getByRole("button", { name: "Restaurar cuenta sin activar" }).click();
  await expect(employee.getByText("Atención · Acceso desactivado", { exact: true })).toBeVisible();
  await layout(page, "personal");
});
test("mozo con contraseña no consulta resumen, clientes ni herramientas administrativas", async ({ page }) => {
  await signInStaffBrowser(page, attendant);
  await expect(page.getByRole("link", { name: "Resumen de fidelización" })).toHaveCount(0);
  for (const path of ["/administracion", "/administracion/personal", "/administracion/incidencias", "/administracion/clientes/" + near.customerId]) {
    await page.goto(path); await expect(page.getByRole("heading", { name: "Acceso no disponible" })).toBeVisible();
    await expect(page.getByText(invitationEmail, { exact: true })).toHaveCount(0);
  }
});
test("premio no entregado se restituye una sola vez desde incidencia", async ({ page, context }) => {
  await actorQuery(manager, "select public.credit_stamp($1,$2,true,true)", [ready.customerId, randomUUID()]);
  const reward = (await staffPool.query("select id from app_private.loyalty_rewards where card_id=$1 and status='available'", [ready.cardId])).rows[0].id;
  const revision = (await staffPool.query("select revision from app_private.loyalty_program_versions where id=$1", [testProgramId])).rows[0].revision;
  await actorQuery(manager, "select public.set_reward_availability($1,$2,true,$3)", [testProgramId, revision, randomUUID()]);
  await actorQuery(manager, "select public.redeem_reward($1,$2,$3,true,true)", [ready.customerId, reward, randomUUID()]);
  await actorQuery(manager, "select public.open_incident($1,'reward_delivery_failed','Premio del piloto sintético no entregado',$2,$3)", [ready.customerId, randomUUID(), reward]);
  await context.addCookies(cookies); await page.goto("/administracion/incidencias");
  await page.getByRole("button", { name: "Revisar incidencia", exact: true }).click();
  await page.getByLabel("Comprobé que este premio no fue entregado físicamente").check();
  await page.getByLabel("Motivo de restitución del premio").fill("Administrador verificó que no hubo entrega");
  await page.getByRole("button", { name: "Restituir premio no entregado" }).click();
  await expect(page.getByText("No hay incidencias para este filtro.")).toBeVisible();
  expect((await staffPool.query("select status from app_private.loyalty_rewards where id=$1", [reward])).rows[0].status).toBe("available");
  await page.goto("/administracion/clientes/" + ready.customerId); await expect(page.getByRole("heading", { name: "Premios disponibles · 1" })).toBeVisible();
  await expect(page.getByText("Premio restituido por falta de entrega", { exact: true }).first()).toBeVisible();
});
test("recuperación presencial invalida acceso antiguo y conserva identidad", async ({ page, context, browser }) => {
  await context.addCookies(cookies); await page.goto("/administracion/clientes/" + near.customerId);
  const eventId = (await staffPool.query("select id from app_private.loyalty_events where card_id=$1 and visit_reference='H7-VISITA-0'", [near.cardId])).rows[0].id;
  await page.getByLabel("Movimiento contrastado con el comprobante").selectOption(eventId);
  await page.getByLabel("Referencia del comprobante presentado").fill("H7-VISITA-0");
  await page.getByLabel("Motivo de recuperación").fill("Titular presencial perdió el enlace guardado");
  await page.getByLabel("El titular está presente en el local").check(); await page.getByLabel("Verifiqué la titularidad comparando comprobante e historial").check();
  await page.getByRole("button", { name: "Invalidar enlace anterior y recuperar acceso" }).click();
  await expect(page.getByLabel("Nuevo enlace privado del cliente")).toBeVisible();
  const link = await page.getByLabel("Nuevo enlace privado del cliente").inputValue();
  await page.setViewportSize({ width: 320, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const ownContext = await browser.newContext({ baseURL: E2E_ORIGIN });
  try {
    const own = await ownContext.newPage(); await own.goto(link); await own.getByRole("button", { name: "Abrir mi tarjeta", exact: true }).click();
    await expect(own.getByText("8 de 10 sellos", { exact: true })).toBeVisible();
    expect((await (await own.request.get("/api/me/card")).json()).data.customerId).toBe(near.customerId);
  } finally { await ownContext.close(); }
});
test("conciliación conserva fecha real, evita referencia duplicada y puede revisarse", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/clientes/" + near.customerId);
  const when = new Date(Date.now() - 10_000).toISOString();
  const peru = new Date(Date.parse(when) - 5 * 60 * 60 * 1000).toISOString().slice(0, 19);
  await page.getByLabel("Fecha y hora real de entrega (Perú)").fill(peru);
  await page.getByLabel("Referencia única del registro de contingencia").fill("H7-CAIDA-UNICA");
  await page.getByLabel("Motivo de conciliación").fill("Compra entregada y pagada durante una caída");
  await page.getByLabel("La compra presencial estaba pagada").check(); await page.getByLabel("El pedido se entregó físicamente en la fecha indicada").check();
  await page.getByRole("button", { name: "Acreditar visita conciliada" }).click();
  await expect(page.getByText("9 de 10 sellos", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Acreditar visita conciliada" }).click();
  await expect(page.getByText("Esta referencia ya tiene un sello. Revisa el último movimiento.", { exact: true })).toBeVisible();
  const event = (await staffPool.query("select occurred_at,recorded_at from app_private.loyalty_events where card_id=$1 and visit_reference='H7-CAIDA-UNICA'", [near.cardId])).rows[0];
  expect(new Date(event.occurred_at).getTime()).toBeLessThan(new Date(event.recorded_at).getTime());
});
test("respuesta perdida se concilia tras recarga con un único efecto", async ({ page, context }) => {
  await context.addCookies(cookies); await page.goto("/administracion/clientes/" + near.customerId);
  const id = (await staffPool.query("select id from app_private.loyalty_events where card_id=$1 and visit_reference='H7-CAIDA-UNICA'", [near.cardId])).rows[0].id;
  await page.getByLabel("Sello original").selectOption(id); await page.getByLabel("Motivo de la reversión").fill("Conciliación equivocada detectada por responsable");
  let lost = false;
  await page.route("**/administracion/clientes/**", async (route) => {
    if (route.request().method() !== "POST" || lost) { await route.continue(); return; }
    lost = true; await route.fetch(); await route.abort("failed");
  });
  await page.getByRole("button", { name: "Confirmar reversión de un sello" }).click();
  await expect(page.getByRole("button", { name: "Comprobar intervención", exact: true })).toBeVisible();
  await page.reload(); await page.getByRole("button", { name: "Comprobar intervención", exact: true }).click();
  await expect(page.getByText("Resultado confirmado sin repetir la intervención.", { exact: true })).toBeVisible();
  await expect(page.getByText("8 de 10 sellos", { exact: true })).toBeVisible();
  expect((await staffPool.query("select count(*)::int total from app_private.loyalty_events where reverses_event_id=$1", [id])).rows[0].total).toBe(1);
});
