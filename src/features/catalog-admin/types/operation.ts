import type { CatalogChange, CatalogEntityType } from "./catalog-admin";
import type { WorkResult } from "@/components/ui/types/form";
import type { StaffMutation } from "@/features/business-config/types/journal";
import type { CheckoutChange } from "@/features/checkout-config/types/config";


export type ConservationInput = { entityType: CatalogEntityType | "payment_method" | "delivery_zone"; entityId: string; expectedRevision: number; reason: string; operationId: string };
export type CatalogOperationInput = CatalogChange | CheckoutChange | ConservationInput;
export type CatalogOperationKind = "save" | "delete" | "restore";

export type CatalogSaveAction = (input: CatalogOperationInput) => Promise<WorkResult<StaffMutation>>;
