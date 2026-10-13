import type { ReactNode } from "react";
import type { z } from "zod";

import type { cardSchema, offerSchema, programSchema, programsSchema, staffCardSchema } from "../validation/dto";
import type { availabilitySchema, cardMutationSchema, costSchema, creditSchema, incidentSchema, lookupSchema, loyaltyJournalSchema, programActivationSchema, redeemSchema } from "../validation/schemas";
import type { OperationError, Result } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export type Card = z.infer<typeof cardSchema>;
export type StaffCard = z.infer<typeof staffCardSchema>;
export type Program = z.infer<typeof programSchema>;
export type Programs = z.infer<typeof programsSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type CardMutation = z.infer<typeof cardMutationSchema>;
export type CreditInput = z.infer<typeof creditSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type ProgramActivation = z.infer<typeof programActivationSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type CostInput = z.infer<typeof costSchema>;
export type LoyaltyInput = CreditInput | RedeemInput | IncidentInput | ProgramActivation | AvailabilityInput | CostInput;
export type LoyaltyJournal = z.infer<typeof loyaltyJournalSchema>;
export type LoyaltyKind = LoyaltyJournal["kind"];
export type LookupResult = z.infer<typeof lookupSchema>;
export type CardProps = { card: Card };
export type StaffCardProps = { initial: StaffCard; actorUserId: string };
export type ProgramPanelProps = { initial: Programs; actorUserId: string; launchReady: boolean };
export type PrivateCardLink = { link: string; qr: string };
export type CardLinkDestination = { destination: string };
export type ActivationProps = { offer: Offer; accessReady: boolean };
export type LoyaltyResult = Result<CardMutation | { operationId: string; replayed: boolean; outcome: "applied" | "review_required"; entityType: string; entityId: string; revision: number }, StaffConflict>;
export type LoyaltyController = {
  pending: boolean; ready: boolean; journal: LoyaltyJournal | null; checked: boolean;
  error: OperationError<StaffConflict> | null; message: string | null;
  setError: (error: OperationError<StaffConflict> | null) => void;
  run: (kind: LoyaltyKind, input: LoyaltyInput) => Promise<void>; check: () => Promise<void>; refresh: () => Promise<void>;
};
export type StaffFormProps = { card: StaffCard; operation: LoyaltyController };
export type ProgramEditorProps = { program: Program; operation: LoyaltyController; launchReady: boolean };

export type CustomerLayoutProps = { children: ReactNode };
