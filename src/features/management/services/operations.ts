import { closeIncidentAction, correctCustomerProfileAction, reverseStampAction } from "../server/actions";
import { creditContingencyAction, recoverCardAccessAction, reinstateRewardAction } from "../server/exception-actions";
import { inviteStaffAction } from "../server/staff-actions";
import type { ManagementInput, ManagementKind } from "../types/management";
import { restoreEntityAction, softDeleteEntityAction, updateStaffAccessAction } from "@/features/staff/server/actions";

export function dispatchManagementOperation(kind: ManagementKind, input: ManagementInput) {
  if (kind === "reinstate") return reinstateRewardAction(input);
  if (kind === "recover") return recoverCardAccessAction(input);
  if (kind === "contingency") return creditContingencyAction(input);
  if (kind === "reverse") return reverseStampAction(input);
  if (kind === "correct") return correctCustomerProfileAction(input);
  if (kind === "close") return closeIncidentAction(input);
  if (kind === "staff") return updateStaffAccessAction(input);
  if (kind === "invite") return inviteStaffAction(input);
  if (kind === "delete") return softDeleteEntityAction(input);
  return restoreEntityAction(input);
}
