import type { z } from "zod";

import type { publicEnvironmentSchema, siteEnvironmentSchema } from "../schemas";

export type EnvironmentInput = Readonly<Record<string, string | undefined>>;
export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type SiteEnvironment = z.infer<typeof siteEnvironmentSchema>;
