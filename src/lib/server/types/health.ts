export type HealthBody = { status: "ok" | "unavailable"; release: string };
export type HealthResult = { body: HealthBody; status: 200 | 503 };
