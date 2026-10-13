import { z } from "zod";

export const dashboardSchema = z.object({
  from: z.iso.date(), until: z.iso.date(), generatedAt: z.iso.datetime({ offset: true }),
  registeredCustomers: z.number().int().nonnegative(), nearReward: z.number().int().nonnegative(), availableRewards: z.number().int().nonnegative(),
  openIncidents: z.number().int().nonnegative(), creditedVisits: z.number().int().nonnegative(), reversedStamps: z.number().int().nonnegative(),
  issuedRewards: z.number().int().nonnegative(), registeredRedemptions: z.number().int().nonnegative(),
  reinstatedRewards: z.number().int().nonnegative(),
});
export const customerRowSchema = z.object({
  id: z.uuid(), displayName: z.string().nullable(), phone: z.string().nullable(), progress: z.number().int().min(0).max(9), netStamps: z.number().int().nonnegative(),
  availableRewards: z.number().int().nonnegative(), lastVisit: z.iso.datetime({ offset: true }).nullable(), cardStatus: z.enum(["active", "suspended"]),
});
export const customerListSchema = z.object({ customers: z.array(customerRowSchema).max(50), nextCursor: z.uuid().nullable() });
export const historyEventSchema = z.object({
  id: z.uuid(), type: z.enum(["stamp_credited", "stamp_reversed", "reward_issued", "reward_redeemed", "reward_voided", "reward_restored", "reward_reinstated"]),
  delta: z.number().int(), occurredAt: z.iso.datetime({ offset: true }), recordedAt: z.iso.datetime({ offset: true }),
  actorStaffId: z.uuid(), actorRole: z.enum(["attendant", "manager"]), operationId: z.uuid(), rewardId: z.uuid().nullable(),
  reversesEventId: z.uuid().nullable(), reason: z.string().nullable(), visitReference: z.string().nullable(), reversed: z.boolean(),
  reinstatesEventId: z.uuid().nullable(),
});
export const historySchema = z.object({ customerId: z.uuid(), events: z.array(historyEventSchema).max(50), nextCursor: z.uuid().nullable() });
export const incidentRowSchema = z.object({
  id: z.uuid(), customerId: z.uuid(), displayName: z.string().nullable(), type: z.enum(["other", "reward_delivery_failed", "correction_requires_review"]),
  description: z.string(), status: z.enum(["open", "closed"]), revision: z.number().int().positive(), rewardId: z.uuid().nullable(), sourceEventId: z.uuid().nullable(),
  openedBy: z.uuid(), createdAt: z.iso.datetime({ offset: true }), resolutionNote: z.string().nullable(), closedBy: z.uuid().nullable(),
  closedAt: z.iso.datetime({ offset: true }).nullable(), deleted: z.boolean(),
});
export const incidentsSchema = z.object({ incidents: z.array(incidentRowSchema).max(50), nextCursor: z.uuid().nullable() });

export const managedStaffSchema = z.object({ staff: z.array(z.object({
  id: z.uuid(), authUserId: z.uuid(), email: z.string().nullable(), role: z.enum(["attendant", "manager"]), active: z.boolean(),
  deleted: z.boolean(), revision: z.number().int().positive(), invitationStatus: z.enum(["pending", "sent", "ready"]),
})) });
export const invitationContextSchema = z.object({ staffId: z.uuid(), userId: z.uuid().nullable(), invitedAt: z.iso.datetime({ offset: true }).nullable(), state: z.enum(["reserved", "pending", "sent", "ready"]) });
export const invitationStageSchema = z.object({ staffId: z.uuid(), revision: z.number().int().positive(), state: z.enum(["pending", "sent", "ready"]), sendAllowed: z.boolean(), alreadyInvited: z.boolean() });
export const recoveredLinkSchema = z.object({ link: z.url(), qr: z.string().startsWith("data:image/png;base64,") });
