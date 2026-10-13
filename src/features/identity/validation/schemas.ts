import { z } from "zod";

const email = z.email("Escribe un correo válido.").trim().max(254);
const captchaToken = z.string().max(4096).optional();
export const loginSchema = z.strictObject({ email, password: z.string().min(1, "Escribe tu contraseña.").max(128), captchaToken });
export const recoverySchema = z.strictObject({ email, captchaToken });
export const passwordSchema = z.strictObject({ password: z.string().min(12, "Usa al menos 12 caracteres.").max(128), confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "Las contraseñas deben coincidir." });
export const mfaSchema = z.strictObject({ factorId: z.uuid(), code: z.string().regex(/^\d{6}$/, "Escribe los seis dígitos del código.") });
export const callbackSchema = z.strictObject({ token_hash: z.string().min(20).max(512), type: z.enum(["invite", "recovery"]) });
export const recoveryMarkerSchema = z.strictObject({ userId: z.uuid(), type: z.enum(["invite", "recovery"]), expiresAt: z.number().int(), nonce: z.uuid() });
