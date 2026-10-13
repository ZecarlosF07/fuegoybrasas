import type { OperationError, Result } from "../types/result";

export function success<T>(data: T, requestId: string): Result<T> {
  return { ok: true, data, requestId };
}

export function failure<TConflict = never>(error: OperationError<TConflict>, requestId: string): Result<never, TConflict> {
  return { ok: false, error, requestId };
}
