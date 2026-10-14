import type { z } from "zod";

import type { recoveryMarkerSchema } from "../validation/schemas";
import type { Result } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export type RecoveryMarker = z.infer<typeof recoveryMarkerSchema>;
export type AuthDestination = { destination: "/personal" | "/personal/restablecer" };
export type AuthFormKind = "login" | "recovery" | "password";
export type AuthFormProps = { kind: AuthFormKind };
export type AuthFormResult = { destination?: string; message?: string };
export type SignOutProps = { audience?: "staff" | "customer" };
export type FormAction<T> = (input: unknown) => Promise<Result<T, StaffConflict>>;
