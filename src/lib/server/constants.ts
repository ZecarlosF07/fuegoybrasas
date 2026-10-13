export const SLOW_OPERATION_MS = 3_000;
export const MINIMUM_FLOW_SECRET_LENGTH = 32;
export const HEALTH_OK = 200;
export const HEALTH_UNAVAILABLE = 503;
export const PRIVATE_RESPONSE_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export const SERVER_OPERATION_NAMES = ["server.work", "catalog.read", "next.render", "next.route", "next.action", "next.proxy", "next.unknown"] as const;
