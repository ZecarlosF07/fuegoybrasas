import { writeServerEvent } from "@/lib/server/telemetry";
import type { RequestErrorHandler } from "@/lib/server/types/telemetry";

export const onRequestError: RequestErrorHandler = (_error, _request, context) => {
  const operation = context.routeType === "render" ? "next.render" : context.routeType === "route" ? "next.route"
    : context.routeType === "action" ? "next.action" : context.routeType === "proxy" ? "next.proxy" : "next.unknown";
  writeServerEvent({ requestId: crypto.randomUUID(), operation, outcome: "failure", code: "SERVICE_UNAVAILABLE", durationMs: 0 });
};
