import type { z } from "zod";

import type { recoveryMarkerSchema } from "../validation/schemas";
import type { Result } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export type RecoveryMarker = z.infer<typeof recoveryMarkerSchema>;
export type AuthDestination = { destination: "/personal/mfa" | "/personal" | "/personal/restablecer" };
export type Enrollment = { factorId: string; qrCode: string; secret: string };
export type AuthFormKind = "login" | "recovery" | "password";
export type CaptchaConfiguration = { provider: "turnstile" | "hcaptcha"; siteKey: string } | null;
export type AuthFormProps = { kind: AuthFormKind; captcha: CaptchaConfiguration; ready: boolean };
export type MfaFormProps = { factorId: string | null };
export type SignOutProps = { audience?: "staff" | "customer" };
export type CaptchaProps = { config: NonNullable<CaptchaConfiguration>; onToken: (token: string) => void; onError: (message: string) => void; resetKey: number };
export type CaptchaApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: CaptchaApi; hcaptcha?: CaptchaApi } }
export type FormAction<T> = (input: unknown) => Promise<Result<T, StaffConflict>>;
