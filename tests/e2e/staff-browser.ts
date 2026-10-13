import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { totpCode } from "../integration/staff-fixture";
import type { StaffFixture } from "../integration/types/staff-fixture";

export async function enrollStaffBrowser(page: Page, staff: StaffFixture) {
  await page.goto("/personal/acceso");
  await page.getByLabel("Correo electrónico").fill(staff.email); await page.getByLabel("Contraseña", { exact: true }).fill(staff.password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click(); await expect(page).toHaveURL(/\/personal\/mfa$/);
  await page.getByRole("button", { name: "Configurar autenticador" }).click(); await page.getByText("Usar clave manual", { exact: true }).click();
  const secret = await page.locator("details p").innerText();
  await page.getByLabel("Código de seis dígitos").fill(totpCode(secret)); await page.getByRole("button", { name: "Verificar e ingresar" }).click();
  await expect(page).toHaveURL(/\/personal$/);
}
