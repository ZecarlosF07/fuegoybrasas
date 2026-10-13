"use client";

import { createContext, useContext } from "react";

import { useCartDraft } from "../hooks/use-cart-draft";
import { useCartValidation } from "../hooks/use-cart-validation";
import type { CartContextValue, CartProviderProps } from "../types/cart";

const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: CartProviderProps) {
  const state = useCartDraft();
  const work = useCartValidation({ current: state.current, available: state.ready && !state.blocked && !state.expired && !state.external, setError: state.setError });
  const valid = work.validation?.revision === state.draft.revision ? work.validation : null;
  return <CartContext.Provider value={{ ...state, validated: valid?.cart ?? null, deadline: valid?.deadline ?? 0, validate: work.validate, validating: work.validating }}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("El carrito requiere su proveedor.");
  return context;
}
