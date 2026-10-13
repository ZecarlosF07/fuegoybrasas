import type { z } from "zod";

import type { Result } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export type RpcResponse = { data: unknown; error: { code?: string; message: string; details?: string } | null };
export type ServerWork<T> = (requestId: string) => Promise<Result<T, StaffConflict>>;
export type OutputSchema<T> = z.ZodType<T>;
