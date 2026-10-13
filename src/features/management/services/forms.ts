import type { z } from "zod";

import type { ManagementKind } from "../types/management";
import type { OperationError } from "@/contracts/types/result";
import { loyaltyFormError } from "@/features/loyalty/services/forms";
import type { StaffConflict } from "@/features/staff/types/staff";

const FIELD_IDS: Partial<Record<ManagementKind, Record<string, string>>> = {
  reverse: { reason: "reverseReason" }, invite: { role: "invitationRole" },
  reinstate: { reason: "resolutionNote" },
  recover: { reference: "proofReference", reason: "recoveryReason" },
  contingency: { visitReference: "contingencyReference", reason: "contingencyReason", paidConfirmed: "contingencyPaid", deliveredConfirmed: "contingencyDelivered" },
};
export function managementError(error: OperationError<StaffConflict>, kind: ManagementKind) {
  if (!error.fieldErrors) return error;
  return { ...error, fieldErrors: Object.fromEntries(Object.entries(error.fieldErrors).map(([name, messages]) => [FIELD_IDS[kind]?.[name] ?? name, messages])) };
}
export function managementFormError(error: z.ZodError, kind: ManagementKind) { return managementError(loyaltyFormError(error), kind); }
export function peruvianDatetime(value: string) { return value ? (value.length === 16 ? value + ":00" : value) + "-05:00" : ""; }
