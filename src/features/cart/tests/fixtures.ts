import { emptyDraft } from "../services/draft";
import type { CartInput, CartLine } from "../types/cart";
import { catalogFixture } from "@/features/catalog/tests/fixtures";
import type { Catalog } from "@/features/catalog/types/catalog";

export const LINE_ID = "33333333-3333-4333-8333-000000000001";
export const PAYMENT_ID = "44444444-4444-4444-8444-000000000001";
export const ZONE_ID = "55555555-5555-4555-8555-000000000001";
export const checkoutCatalog: Catalog = { ...catalogFixture, configuration: { ...catalogFixture.configuration, orderingEnabled: true, paymentsReady: false, paymentMethods: [] } };
export const cartLine: CartLine = { lineId: LINE_ID, itemId: catalogFixture.items[0].id, quantity: 2, choiceIds: [], observedItemRevision: 1, observedUnitPriceCents: 8990, instructions: "Sin ají", instructionsStatus: "ready", displaySnapshot: { name: "Gran Promoción", portion: "1 pollo entero + ½ pollo", choices: [] } };
export const cartInput: CartInput = { mode: "delivery", lines: [{ lineId: cartLine.lineId, itemId: cartLine.itemId, quantity: cartLine.quantity, choiceIds: [], observedItemRevision: 1, observedUnitPriceCents: 8990 }] };
export const cartDraft = { ...emptyDraft("2026-10-08T17:00:00.000Z"), mode: cartInput.mode, lines: [cartLine], checkout: { ...emptyDraft().checkout, name: "Invitado sintético", address: "Dirección sintética 123", instructions: "Tocar la puerta" } };
export const fingerprint = "a".repeat(64);
