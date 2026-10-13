import "server-only";

import { SLOW_OPERATION_MS } from "./constants";
import type { ServerEventInput } from "./types/telemetry";
import { serverEventSchema } from "./validation/telemetry";

export function writeServerEvent(input: ServerEventInput) {
  if (process.env.APP_TELEMETRY_ENABLED !== "true") return;
  // Allowlist en ejecución: ningún error, URL, payload, sesión o texto personal entra en logs.
  const event = serverEventSchema.safeParse(input);
  if (!event.success) {
    console.error(JSON.stringify({ event: "telemetry_invalid", timestamp: new Date().toISOString() }));
    return;
  }
  console.info(JSON.stringify({ event: "server_operation", timestamp: new Date().toISOString(), ...event.data,
    durationMs: Math.round(event.data.durationMs), slow: event.data.durationMs >= SLOW_OPERATION_MS }));
}
