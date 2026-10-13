import type { z } from "zod";

import type { LoyaltyController, LoyaltyKind } from "../types/loyalty";
import type { OperationError } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export function loyaltyFormError(error: z.ZodError): OperationError<StaffConflict> {
  return { code: "VALIDATION_ERROR", message: "Revisa las confirmaciones y los datos indicados.", fieldErrors: Object.fromEntries(error.issues.map((issue) => [issue.path.filter((part) => part !== "checks").join("."), [issue.message]])) };
}
export function formOperationId(operation: LoyaltyController) { return operation.journal?.operationId ?? crypto.randomUUID(); }
export function formBlocked(operation: LoyaltyController, kind: LoyaltyKind, customerId?: string) {
  if (!operation.ready || operation.pending) return true;
  if (!operation.journal) return false;
  return !operation.checked || operation.journal.kind !== kind || (customerId !== undefined && operation.journal.customerId !== customerId);
}
