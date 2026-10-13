import type { z } from "zod";

import type { staffAccessSchema, staffConflictSchema } from "../validation/schemas";

export type StaffAccess = z.infer<typeof staffAccessSchema>;
export type StaffConflict = z.infer<typeof staffConflictSchema>;
