import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { StaffFixture } from "../integration/types/staff-fixture";

export async function signInStaffBrowser(page: Page, staff: StaffFixture) {
  await page.goto("/personal/acceso");
  await page.getByLabel("Correo electrónico").fill(staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(staff.password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/personal$/);
}
