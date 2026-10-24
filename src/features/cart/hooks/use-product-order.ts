"use client";

import { useState } from "react";

import { useCart } from "../components/cart-provider";
import { purchaseLine } from "../services/purchase";
import type { OperationError } from "@/contracts/types/result";
import { orderUnitPrice } from "@/features/catalog/services/presentation";
import type { CatalogItem } from "@/features/catalog/types/catalog";

export function useProductOrder(item: CatalogItem) {
  const cart = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<OperationError | null>(null);
  const disabled = !cart.ready || cart.blocked || cart.expired || cart.external || cart.validating || item.availability !== "available" || orderUnitPrice(item) === null;
  function add(form: FormData) {
    if (disabled) return;
    setError(null); setNotice(null);
    try {
      const line = purchaseLine(item, form, crypto.randomUUID());
      if (cart.dispatch({ type: "addLine", line })) setNotice("Producto agregado. Puedes seguir eligiendo o revisar el pedido.");
      else setError({ code: "VALIDATION_ERROR", message: "No pudimos agregar este plato. Revisa los límites y el estado de tu pedido." });
    } catch (cause) {
      setError({ code: "VALIDATION_ERROR", message: cause instanceof Error ? cause.message : "Revisa tus opciones." });
    }
  }
  return { add, disabled, notice, error, recoveryPending: cart.blocked || cart.expired || cart.external };
}
