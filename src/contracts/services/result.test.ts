import { expect, expectTypeOf, it } from "vitest";

import { failure, success } from "./result";
import type { ErrorCode, MutationMeta, Result } from "../types/result";

it("mantiene un contrato discriminado y errores sin excepción interna", () => {
  expect(success({ ready: true }, "request-1")).toEqual({ ok: true, data: { ready: true }, requestId: "request-1" });
  expect(failure({ code: "SERVICE_UNAVAILABLE", message: "Intenta nuevamente." }, "request-2")).toEqual({
    ok: false, error: { code: "SERVICE_UNAVAILABLE", message: "Intenta nuevamente." }, requestId: "request-2",
  });
  expectTypeOf<string>().not.toExtend<ErrorCode>();
  expectTypeOf(success(undefined, "request-3")).toExtend<Result<void>>();
  expectTypeOf<MutationMeta["outcome"]>().toEqualTypeOf<"applied" | "review_required">();
});
