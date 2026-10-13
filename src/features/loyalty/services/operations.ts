import { creditStampAction, openIncidentAction, redeemRewardAction } from "../server/actions";
import { activateLoyaltyProgramAction, setRewardAvailabilityAction, updateRewardCostAction } from "../server/program-actions";
import type { LoyaltyInput, LoyaltyKind, LoyaltyResult } from "../types/loyalty";

export function dispatchLoyaltyOperation(kind: LoyaltyKind, input: LoyaltyInput): Promise<LoyaltyResult> {
  if (kind === "credit") return creditStampAction(input);
  if (kind === "redeem") return redeemRewardAction(input);
  if (kind === "incident") return openIncidentAction(input);
  if (kind === "activate") return activateLoyaltyProgramAction(input);
  if (kind === "availability") return setRewardAvailabilityAction(input);
  return updateRewardCostAction(input);
}
