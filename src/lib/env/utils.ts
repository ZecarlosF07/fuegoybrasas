import { z } from "zod";

import type { EnvironmentInput } from "./types/environment";

export function parseEnvironment<T>(schema: z.ZodType<T>, input: EnvironmentInput): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
  throw new Error(`Configuración inválida: ${fields.join(", ")}. Revisar .env.local.`);
}
