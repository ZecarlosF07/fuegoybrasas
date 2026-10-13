import type { ERROR_CODES } from "../error-codes";

export type ErrorCode = typeof ERROR_CODES[number];
export type LineIssue = { lineId: string; code: ErrorCode; message: string };
export type OperationError<TConflict = never> = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  lineIssues?: LineIssue[];
  retryAfterSeconds?: number;
  currentState?: TConflict;
};
// Los DTO de conflicto se concretan por dominio al implementarlo, sin fingir tablas futuras.
export type Result<T, TConflict = never> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: OperationError<TConflict>; requestId: string };
export type MutationMeta = {
  operationId: string;
  replayed: boolean;
  outcome: "applied" | "review_required";
};
