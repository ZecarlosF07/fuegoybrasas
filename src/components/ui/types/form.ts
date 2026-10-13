import type { ComponentProps } from "react";

import type { OperationError, Result } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export type SubmitButtonProps = { pending: boolean; label: string; pendingLabel: string; disabled?: boolean };
export type FormFeedbackProps = { error: OperationError<StaffConflict> | null; message?: string | null };
export type CheckboxFieldProps = Omit<ComponentProps<"input">, "type"> & { label: string; help?: string };
export type WorkResult<T> = Result<T, StaffConflict>;
export type SelectFieldProps = Omit<ComponentProps<"select">, "id"> & { id: string; label: string; help?: string; error?: string };
