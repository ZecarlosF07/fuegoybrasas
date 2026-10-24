import type { ReactNode, RefObject } from "react";
import type { z } from "zod";

import type { cartLineSchema, cartValidationSchema, checkoutFieldsSchema, storedCartSchema, validatedCartSchema } from "../validation/schemas";
import type { OperationError } from "@/contracts/types/result";
import type { Catalog, CatalogItem } from "@/features/catalog/types/catalog";

export type CartLine = z.infer<typeof cartLineSchema>;
export type CheckoutFields = z.infer<typeof checkoutFieldsSchema>;
export type CartInput = z.infer<typeof cartValidationSchema>;
export type ValidatedCart = z.infer<typeof validatedCartSchema>;
export type StoredCart = z.infer<typeof storedCartSchema>;
export type CartDraft = { schemaVersion: 1; updatedAt: string; lines: CartLine[]; checkout: CheckoutFields; revision: number };
export type CartAction = { type: "hydrate"; draft: CartDraft } | { type: "addLine"; line: CartLine } | { type: "editLine"; line: CartLine } | { type: "setQuantity"; lineId: string; quantity: number } | { type: "removeLine"; lineId: string } | { type: "setCheckout"; fields: CheckoutFields } | { type: "acceptCatalogChanges"; result: ValidatedCart } | { type: "clearDraft" };
export type CartRecovery = { draft: CartDraft; warning: string | null; blocked: boolean; expired: boolean };
export type CartContextValue = { draft: CartDraft; ready: boolean; warning: string | null; blocked: boolean; expired: boolean; external: boolean; validated: ValidatedCart | null; deadline: number; dispatch: (action: CartAction) => boolean; resolveRecovery: (reset: boolean) => void; loadExternal: () => void; validate: () => Promise<boolean>; validating: boolean; error: OperationError | null; setError: (error: OperationError | null) => void };
export type CartProviderProps = { children: ReactNode };
export type CartPageProps = { catalog: Catalog; step: "cart" | "continue" };
export type PurchaseProps = { item: CatalogItem; catalog: Catalog };
export type ProductCardActionProps = { item: CatalogItem; orderingEnabled: boolean; selectedSlug: string };
export type ChoiceFieldsProps = { item: CatalogItem; selected: string[]; disabled?: boolean; prefix?: string };
export type CartLineProps = { line: CartLine; item?: CatalogItem };

export type CartValidationOptions = { current: RefObject<CartDraft>; available: boolean; setError: (error: OperationError | null) => void };

export type CartStep = CartPageProps["step"];

export type PreparedMessage = { message: string; url: string; long: boolean };
export type CartPageRecoveryProps = { message: string; step: CartStep };
export type CartValidationState = { cart: ValidatedCart; revision: number; deadline: number };
export type CartValidationResult = { data: ValidatedCart; error?: never } | { error: OperationError; data?: never };
