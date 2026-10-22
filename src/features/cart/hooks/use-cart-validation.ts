"use client";

import { useRef, useState } from "react";
import { z } from "zod";

import { draftInput } from "../services/draft";
import { validationDeadline } from "../services/message";
import type { CartValidationOptions, CartValidationState } from "../types/cart";
import { cartValidationSchema, checkoutFormSchema, validatedCartSchema } from "../validation/schemas";
import { ERROR_CODES } from "@/contracts/error-codes";

const responseSchema = z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), requestId: z.string(), data: validatedCartSchema }), z.object({ ok: z.literal(false), requestId: z.string(), error: z.object({ code: z.enum(ERROR_CODES), message: z.string().max(1000), fieldErrors: z.record(z.string(), z.array(z.string())).optional() }) })]);
export function useCartValidation({ current, available, setError }: CartValidationOptions) {
  const [validation, setValidation] = useState<CartValidationState | null>(null);
  const [validating, setValidating] = useState(false);
  const busy = useRef(false);
  async function validate() {
    if (busy.current || !available) return false;
    const draft = current.current;
    const form = checkoutFormSchema.safeParse({ ...draft.checkout, mode: draft.mode });
    const input = cartValidationSchema.safeParse(draftInput(draft));
    if (!form.success) {
      const fieldErrors = Object.fromEntries(form.error.issues.map((issue) => [issue.path.join("."), [issue.message]]));
      setError({ code: "VALIDATION_ERROR", message: "Revisa los datos del pedido.", fieldErrors }); return false;
    }
    if (!input.success || draft.lines.some((line) => line.instructionsStatus !== "ready")) { setError({ code: "VALIDATION_ERROR", message: "Revisa los productos, modalidad e indicaciones del carrito." }); return false; }
    busy.current = true; setValidating(true); setValidation(null); setError(null);
    const startedAt = performance.now();
    try {
      const response = await fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.data), cache: "no-store", signal: AbortSignal.timeout(15000) });
      const result = responseSchema.parse(await response.json());
      if (current.current.revision !== draft.revision) { setError({ code: "CATALOG_CHANGED", message: "El borrador cambió durante la revisión. Vuelve a validarlo." }); return false; }
      if (!result.ok) { setError(result.error); return false; }
      const deadline = validationDeadline(startedAt, result.data);
      if (performance.now() >= deadline) { setError({ code: "CATALOG_CHANGED", message: "La revisión expiró. Vuelve a validar el pedido." }); return false; }
      setValidation({ cart: result.data, revision: draft.revision, deadline });
      return result.data.status === "ready";
    } catch { setError({ code: "SERVICE_UNAVAILABLE", message: "No pudimos validar el pedido. Conservamos el borrador; vuelve a intentarlo." }); return false; }
    finally { busy.current = false; setValidating(false); }
  }
  return { validation, validating, validate, clearValidation: () => setValidation(null) };
}
