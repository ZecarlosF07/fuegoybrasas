import type { z } from "zod";

import type { configSchema, openingPeriodSchema } from "../validation/schemas";

export type BusinessConfig = z.infer<typeof configSchema>;
export type OpeningPeriod = z.infer<typeof openingPeriodSchema>;
export type ConfigFormProps = { initial: BusinessConfig; actorUserId: string };
export type ScheduleEditorProps = { periods: OpeningPeriod[]; disabled: boolean; onChange: (value: OpeningPeriod[]) => void };
export type ConfigFieldsProps = { config: BusinessConfig; disabled: boolean; errors?: Record<string, string[]> };
