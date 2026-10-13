import type { Instrumentation } from "next";
import type { z } from "zod";

import type { serverEventSchema } from "../validation/telemetry";

export type ServerEventInput = z.infer<typeof serverEventSchema>;
export type RequestErrorHandler = Instrumentation.onRequestError;
