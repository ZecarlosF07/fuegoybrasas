import type { z } from "zod";

import type { CATALOG_ENTITY_TYPES } from "../constants";
import type { adminCatalogSchema, catalogChangeSchema } from "../validation/schemas";

export type CatalogEntityType = typeof CATALOG_ENTITY_TYPES[number];
export type AdminCatalog = z.infer<typeof adminCatalogSchema>;
export type CatalogChange = z.infer<typeof catalogChangeSchema>;
export type AdminRow = { id?: string; item_id?: string; group_id?: string; revision: number; deleted_at: string | null; delete_reason?: string | null; [field: string]: unknown };
export type AdminPanelProps = { initial: AdminCatalog; actorUserId: string };
export type EntitySelection = { entityType: CatalogEntityType; entityId: string; row: AdminRow; creating?: boolean };
export type EntityEditorProps = { selection: EntitySelection; catalog: AdminCatalog; actorUserId: string; onSaved: (message?: string) => Promise<void>; onBusyChange: (busy: boolean) => void };
export type FieldDefinition = { name: string; label: string; kind?: "boolean" | "textarea" | "money" | "number" | "select" | "weekdays" | "datetime"; options?: ReadonlyArray<{ value: string; label: string }>; help?: string };
export type FieldsProps = { entityType: CatalogEntityType; row: AdminRow; disabled: boolean; errors?: Record<string, string[]>; creating?: boolean; catalog: AdminCatalog };
export type Journal = { actorUserId: string; operationId: string; fingerprint: string; entityId: string; entityType: CatalogEntityType | "payment_method" | "delivery_zone"; configRevision?: number; expectedRevision: number; createdAt: number; kind: "save" | "delete" | "restore" };
export type ImageEditorProps = { itemId: string; actorUserId: string; currentPath: string | null; disabled: boolean; onAssociate: (path: string | null) => Promise<void>; onBusyChange: (busy: boolean) => void };
export type RelatedRecordsProps = { catalog: AdminCatalog; itemId: string; showDeleted: boolean; disabled: boolean; onSelect: (selection: EntitySelection) => void; onCreate: (type: CatalogEntityType, parent: string) => void };
export type CatalogListProps = { catalog: AdminCatalog; disabled: boolean; showDeleted: boolean; onSelect: (selection: EntitySelection) => void };
