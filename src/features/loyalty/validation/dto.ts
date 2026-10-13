import { z } from "zod";

export const rewardSchema = z.object({
  id: z.uuid(), name: z.string(), contents: z.array(z.string()), issuedAt: z.iso.datetime({ offset: true }), ordinal: z.number().int().positive(),
});
export const eventSchema = z.object({
  type: z.enum(["stamp_credited", "stamp_reversed", "reward_issued", "reward_redeemed", "reward_voided", "reward_restored", "reward_reinstated"]),
  date: z.iso.datetime({ offset: true }), delta: z.number().int(),
});
export const cardSchema = z.object({
  customerId: z.uuid(), displayName: z.string(), phoneMasked: z.string().nullable(), frequentInstructions: z.string().max(500),
  profileRevision: z.number().int().positive(), cardId: z.uuid(), cardRevision: z.number().int().positive(),
  cardStatus: z.enum(["active", "suspended"]), programEnabled: z.boolean(), progress: z.number().int().min(0).max(9),
  netStamps: z.number().int().nonnegative(), target: z.literal(10), programLabel: z.string(),
  rewardProductAvailable: z.boolean(), termsVersion: z.string(), availableRewards: z.array(rewardSchema), recentEvents: z.array(eventSchema).max(10),
});
export const staffCardSchema = cardSchema.extend({
  phone: z.string().nullable(),
  recentEvents: z.array(eventSchema.extend({ id: z.uuid(), operationId: z.uuid(), visitReference: z.string().nullable(), rewardId: z.uuid().nullable() })).max(10),
  openIncidents: z.array(z.object({ id: z.uuid(), type: z.string(), createdAt: z.iso.datetime({ offset: true }) })),
});
export const programSchema = z.object({
  id: z.uuid(), code: z.string(), target: z.literal(10), rewardName: z.string(), rewardContents: z.array(z.string()),
  costCents: z.number().int().nonnegative().nullable(), available: z.boolean(), termsVersion: z.string(),
  status: z.enum(["draft", "active", "retired"]), revision: z.number().int().positive(),
});
export const programsSchema = z.object({ enabled: z.boolean(), programs: z.array(programSchema) });
export const offerSchema = z.object({ enabled: z.boolean(), termsVersion: z.string().nullable(), target: z.literal(10), rewardName: z.string() });
