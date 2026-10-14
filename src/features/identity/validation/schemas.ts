import { z } from "zod";

const email = z.email("Escribe un correo válido.").trim().max(254);
export const loginSchema = z.strictObject({ email, password: z.string().min(1, "Escribe tu contraseña.").max(128) });
export const recoverySchema = z.strictObject({ email });
export const passwordSchema = z.strictObject({ password: z.string().min(12, "Usa al menos 12 caracteres.").max(128), confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "Las contraseñas deben coincidir." });
export const callbackSchema = z.strictObject({ token_hash: z.string().min(20).max(512), type: z.enum(["invite", "recovery"]) });
export const recoveryMarkerSchema = z.strictObject({ userId: z.uuid(), type: z.enum(["invite", "recovery"]), expiresAt: z.number().int(), nonce: z.uuid() });
