import { describe, expect, it, vi } from "vitest";

import { signRecoveryMarker, verifyRecoveryMarker } from "./recovery-marker";

const userId = "a98a5275-9301-42e1-8ae7-c7464ef13b90";
describe("permiso acotado de restablecimiento", () => {
  it("está firmado, limitado a diez minutos y vinculado a la identidad", () => {
    vi.stubEnv("STAFF_AUTH_FLOW_SECRET", "synthetic-h2-marker-secret-long-enough-for-tests");
    const marker = signRecoveryMarker(userId, "recovery", 1000);
    expect(verifyRecoveryMarker(marker, userId, 1001)).toBe(true);
    expect(verifyRecoveryMarker(marker, "d9e7f69c-a6af-46c5-b379-a530f80974ba", 1001)).toBe(false);
    expect(verifyRecoveryMarker(marker, userId, 601000)).toBe(false);
    expect(verifyRecoveryMarker(`${marker}tampered`, userId, 1001)).toBe(false);
    expect(verifyRecoveryMarker(undefined, userId, 1001)).toBe(false);
    vi.unstubAllEnvs();
  });
});
