import { z } from "zod";

import { SERVER_OPERATION_NAMES } from "../constants";
import { ERROR_CODES } from "@/contracts/error-codes";

export const serverEventSchema = z.strictObject({
  requestId: z.uuid(), operation: z.enum(SERVER_OPERATION_NAMES),
  outcome: z.enum(["success", "failure", "uncertain"]), code: z.enum(ERROR_CODES).optional(),
  durationMs: z.number().finite().nonnegative(), operationId: z.uuid().optional(),
});
