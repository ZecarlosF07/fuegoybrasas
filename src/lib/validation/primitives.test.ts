import { expect, it } from "vitest";

import { DELETE_REASON_SCHEMA, UTC_TIMESTAMP_SCHEMA, UUID_SCHEMA } from "./primitives";

it("valida UUID, fecha UTC y motivo administrativo acotado", () => {
  expect(UUID_SCHEMA.safeParse("arbitrary-id").success).toBe(false);
  expect(UUID_SCHEMA.safeParse(crypto.randomUUID()).success).toBe(true);
  expect(UTC_TIMESTAMP_SCHEMA.safeParse("2026-10-04T12:00:00Z").success).toBe(true);
  expect(UTC_TIMESTAMP_SCHEMA.safeParse("2026-10-04T12:00:00-05:00").success).toBe(false);
  expect(DELETE_REASON_SCHEMA.safeParse("   corto   ").success).toBe(false);
  expect(DELETE_REASON_SCHEMA.safeParse("x".repeat(501)).success).toBe(false);
});
