import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { evidenceDirectory } from "./evidence";
import { actorQuery, cleanupStaffFixtures, createInvitationFixture, createStaffFixture, staffAdmin, staffPool } from "../integration/staff-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

test.describe.configure({ mode: "serial", timeout: 90000 });
test.use({ trace: "off" }); // No guardar credenciales, enlaces de recuperación ni QR en trazas.
const identities: StaffFixture[] = [];
const screenshots = evidenceDirectory("h2/capturas");
let manager: StaffFixture, attendant: StaffFixture, outsider: StaffFixture;
let originalName: string, originalRevision: number;
test.beforeAll(async () => {
  manager = await createStaffFixture("manager"); identities.push(manager);
  attendant = await createStaffFixture("attendant", manager.staffId ?? undefined); identities.push(attendant);
  outsider = await createStaffFixture(null); identities.push(outsider);
  const original = (await staffPool.query("select display_name,revision from public.business_settings where id=1")).rows[0];
  originalName = original.display_name; originalRevision = original.revision;
});
test.afterAll(async () => {
  await staffPool.query("update public.business_settings set display_name=$1,revision=$2 where id=1", [originalName, originalRevision]);
  await cleanupStaffFixtures(identities); await staffPool.end();
});

test("sin JavaScript el acceso no envía credenciales mediante navegación GET", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3100/personal/acceso");
    await page.getByLabel("Correo electrónico").fill("sin-js@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("Texto sintético sin cuenta");
    await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeDisabled();
    await page.getByLabel("Contraseña", { exact: true }).press("Enter");
    expect(new URL(page.url()).search.length).toBe(0);
    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  } finally { await context.close(); }
});

test("acceso y recuperación adaptables, accesibles y con foco en errores", async ({ page }) => {
  for (const width of [360, 390, 768, 1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/personal/acceso");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByLabel("Correo electrónico")).toHaveAttribute("autocomplete", "username");
    await expect(page.getByLabel("Contraseña", { exact: true })).toHaveAttribute("autocomplete", "current-password");
    await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeEnabled();
    expect(await page.locator('script[src*="turnstile"], script[src*="hcaptcha"]').count()).toBe(0);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${screenshots}/acceso-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toBeFocused();
  await page.screenshot({ path: `${screenshots}/error-acceso.png`, fullPage: true });
  await page.getByRole("link", { name: "Olvidé mi contraseña" }).click();
  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
});

test("URLs privadas, callback libre y reset sin permiso están protegidos", async ({ page }) => {
  await page.goto("/personal"); await expect(page).toHaveURL(/\/personal\/acceso$/);
  await page.goto("/personal/mfa"); await expect(page).toHaveURL(/\/personal\/acceso$/);
  await page.goto("/administracion/configuracion"); await expect(page).toHaveURL(/\/personal\/acceso$/);
  await page.goto("/auth/confirm?token_hash=invalid-synthetic-token&next=https://example.org&type=recovery");
  await expect(page).toHaveURL(/\/personal\/acceso\?estado=enlace-invalido$/);
  await page.goto("/personal/restablecer"); await expect(page.getByRole("heading", { name: "Solicita un nuevo enlace" })).toBeVisible();
});

test("login con contraseña, configuración real, conflicto y logout", async ({ page }) => {
  await page.goto("/personal/acceso");
  await page.getByLabel("Correo electrónico").fill(manager.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(manager.password + "-incorrecta");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Revisa tus datos");
  await page.getByLabel("Correo electrónico").fill(manager.email); await page.getByLabel("Contraseña", { exact: true }).fill(manager.password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.getByRole("link", { name: "Configuración", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Configuración del local" })).toBeVisible();
  await page.getByLabel("Nombre del local").fill("Prueba controlada H2");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByRole("status")).toHaveText("Configuración guardada.");
  await expect(page.getByLabel("Nombre del local")).toHaveValue("Prueba controlada H2");
  await page.route("**/administracion/configuracion", async (route) => {
    await route.fetch();
    await route.abort("failed");
  }, { times: 1 });
  await page.getByLabel("Nombre del local").fill("Guardado con respuesta perdida H2");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("No pudimos comprobar");
  const diary = await page.evaluate(() => sessionStorage.getItem("fyb.staff-operations.v1"));
  expect(Boolean(diary)).toBe(true);
  expect(diary).not.toContain("Guardado con respuesta perdida");
  expect(diary).not.toContain("+51982042493");
  await page.getByRole("button", { name: "Comprobar resultado" }).click();
  await expect(page.getByRole("status")).toContainText("Se comprobó el guardado");
  await expect(page.getByLabel("Nombre del local")).toHaveValue("Guardado con respuesta perdida H2");
  expect(await page.evaluate(() => sessionStorage.getItem("fyb.staff-operations.v1"))).toBeNull();
  const revision = (await staffPool.query("select revision from public.business_settings where id=1")).rows[0].revision;
  await actorQuery(manager, "select public.update_business_config($1,'{\"displayName\":\"Cambio concurrente H2\"}',$2)", [revision, randomUUID()]);
  await page.getByLabel("Nombre del local").fill("Edición antigua retenida");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("El registro cambió");
  await expect(page.getByLabel("Nombre del local")).toHaveValue("Edición antigua retenida");
  await page.getByRole("button", { name: "Descartar cambios y cargar versión actual" }).click();
  await expect(page.getByLabel("Nombre del local")).toHaveValue("Cambio concurrente H2");
  await page.screenshot({ path: `${screenshots}/configuracion.png`, fullPage: true });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/personal\/acceso$/);
  await page.goto("/personal"); await expect(page).toHaveURL(/\/personal\/acceso$/);
});

test("recuperación consume enlace y permite ingresar con la nueva contraseña", async ({ page }) => {
  const link = await staffAdmin.generateLink({ type: "recovery", email: manager.email, options: { redirectTo: "http://127.0.0.1:3100/auth/confirm" } });
  if (link.error) throw new Error("No se pudo preparar el enlace sintético de recuperación.");
  const url = `http://127.0.0.1:3100/auth/confirm?token_hash=${encodeURIComponent(link.data.properties.hashed_token)}&type=recovery`;
  await page.goto(url);
  await expect(page).toHaveURL(/\/personal\/restablecer$/);
  await expect(page.getByLabel("Código de seis dígitos")).toHaveCount(0);
  await page.screenshot({ path: `${screenshots}/recuperacion.png`, fullPage: true });
  await expect(page.getByRole("heading", { name: "Nueva contraseña" })).toBeVisible();
  await page.getByLabel("Nueva contraseña", { exact: true }).fill(`${manager.password}N`);
  await page.getByLabel("Repite la contraseña").fill(`${manager.password}N`);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByLabel("Correo electrónico").fill(manager.email); await page.getByLabel("Contraseña", { exact: true }).fill(`${manager.password}N`);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.goto(url); await expect(page).toHaveURL(/estado=enlace-invalido/);
});

test("usuario Auth sin personal ve denegación y puede cerrar su sesión", async ({ page }) => {
  await page.goto("/personal/acceso");
  await page.getByLabel("Correo electrónico").fill(outsider.email); await page.getByLabel("Contraseña", { exact: true }).fill(outsider.password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Esta cuenta no tiene acceso");
  await page.goto("/personal"); await expect(page.getByRole("heading", { name: "Acceso no disponible" })).toBeVisible();
  await page.screenshot({ path: `${screenshots}/acceso-denegado.png`, fullPage: true });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/personal\/acceso$/);
});

test("invitación válida conduce a contraseña; atención no entra a administración", async ({ page }) => {
  if (!manager.staffId) throw new Error("Falta el responsable de prueba.");
  const invitation = await createInvitationFixture(manager.staffId);
  identities.push(invitation.fixture);
  await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(invitation.tokenHash)}&type=invite`);
  await expect(page.getByRole("heading", { name: "Nueva contraseña" })).toBeVisible();
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("Synthetic-password-H2-2026!");
  await page.getByLabel("Repite la contraseña").fill("Synthetic-password-H2-2026!");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL(/\/personal$/);
  await expect(page.getByRole("link", { name: "Configuración", exact: true })).toHaveCount(0);
  await page.goto("/administracion/configuracion");
  await expect(page.getByRole("heading", { name: "Acceso no disponible" })).toBeVisible();
  await expect(page.getByText("Solo el responsable puede acceder a la configuración.")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
});
