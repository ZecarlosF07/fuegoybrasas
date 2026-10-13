import { describe, expect, it } from "vitest";

import { publicIndexingAllowed } from "./indexing";

describe("Indexación solo tras habilitación de publicación", () => {
  it("desarrollo y preview permanecen excluidos aunque se copie la bandera", () => {
    expect(publicIndexingAllowed({ APP_INDEXING_ENABLED: "true" })).toBe(false);
    expect(publicIndexingAllowed({ APP_INDEXING_ENABLED: "true", APP_DEPLOYMENT_TARGET: "production", VERCEL_ENV: "preview" })).toBe(false);
  });
  it("producción necesita aprobación explícita", () => {
    expect(publicIndexingAllowed({ APP_DEPLOYMENT_TARGET: "production" })).toBe(false);
    expect(publicIndexingAllowed({ APP_DEPLOYMENT_TARGET: "production", APP_INDEXING_ENABLED: "true" })).toBe(true);
  });
});
