import type { z } from "zod";

import type { checkoutConfigChangeSchema, paymentRowSchema, zoneRowSchema } from "../validation/schemas";
import type { BusinessConfig } from "@/features/business-config/types/config";

export type CheckoutChange = z.infer<typeof checkoutConfigChangeSchema>;
export type CheckoutEntityType = CheckoutChange["entityType"];
export type CheckoutRow = z.infer<typeof paymentRowSchema> | z.infer<typeof zoneRowSchema>;
export type CheckoutSelection = { entityType: CheckoutEntityType; entityId: string; row: Partial<CheckoutRow>; creating: boolean };
export type CheckoutPanelProps = { initial: BusinessConfig; actorUserId: string };
export type CheckoutEditorProps = { selection: CheckoutSelection; configRevision: number; actorUserId: string; onSaved: (message?: string) => Promise<void>; onBusyChange: (busy: boolean) => void };
export type CheckoutFieldProps = { selection: CheckoutSelection; disabled: boolean; errors?: Record<string, string[]> };
