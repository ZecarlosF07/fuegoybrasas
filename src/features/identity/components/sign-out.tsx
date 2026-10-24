"use client";

import { AsyncButton } from "@/components/ui/async-button";
import { failure, success } from "@/contracts/services/result";
import { CATALOG_JOURNAL_KEY } from "@/features/catalog-admin/constants";
import { MEDIA_JOURNAL_KEY } from "@/features/catalog-admin/services/media";
import { PRIVATE_CHECKOUT_KEY, STAFF_JOURNAL_KEY } from "@/features/identity/constants";
import { signOutStaffAction } from "@/features/identity/server/actions";
import type { SignOutProps } from "@/features/identity/types/auth";
import { forgetCardAction } from "@/features/loyalty/server/card-access-actions";

export function SignOut({ audience = "staff", variant = "secondary" }: SignOutProps) {
  async function signOut() {
    const result = await (audience === "customer" ? forgetCardAction() : signOutStaffAction());
    if (!result.ok) return failure({ code: result.error.code, message: result.error.message }, result.requestId);
    // Datos privados solamente; el pedido invitado permanece en su almacenamiento propio.
    if (audience === "staff") {
      sessionStorage.removeItem(STAFF_JOURNAL_KEY);
      sessionStorage.removeItem(CATALOG_JOURNAL_KEY);
      sessionStorage.removeItem(MEDIA_JOURNAL_KEY);
    }
    sessionStorage.removeItem(PRIVATE_CHECKOUT_KEY);
    window.location.replace(audience === "customer" ? "/" : "/personal/acceso");
    return success(undefined, result.requestId);
  }
  return <AsyncButton action={signOut} label="Cerrar sesión" pendingLabel="Cerrando sesión…" variant={variant} />;
}
