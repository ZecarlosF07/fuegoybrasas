export type ConfigJournal = { actorUserId: string; operationId: string; expectedRevision: number; fingerprint: string; createdAt: number };
import type { z } from "zod";

import type { mutationSchema, operationSchema } from "@/features/staff/validation/schemas";

export type StaffMutation = z.infer<typeof mutationSchema>;
export type StaffOperation = z.infer<typeof operationSchema>;
