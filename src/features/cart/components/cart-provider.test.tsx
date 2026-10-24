import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "./cart-provider";
import { readDraft, serializeDraft } from "../services/storage";
import { validateCart } from "../services/validation";
import { cartDraft, cartInput, cartLine, checkoutCatalog, fingerprint } from "../tests/fixtures";

afterEach(() => { localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });
function Harness() {
  const cart = useCart();
  return <><p>{cart.ready ? "Listo" : "Recuperando"}</p><p>{cart.error?.message}</p><p>{cart.warning}</p><p>{cart.validated?.status}</p><button onClick={() => cart.dispatch({ type: "addLine", line: cartLine })}>Agregar</button><button onClick={() => cart.dispatch({ type: "setCheckout", fields: cartDraft.checkout })}>Datos</button><button onClick={() => cart.dispatch({ type: "setQuantity", lineId: cartLine.lineId, quantity: 3 })}>Editar</button><button onClick={cart.validate} disabled={cart.validating}>{cart.validating ? "Validando" : "Validar"}</button></>;
}
async function start() {
  render(<CartProvider><Harness /></CartProvider>);
  await screen.findByText("Listo"); fireEvent.click(screen.getByText("Agregar")); fireEvent.click(screen.getByText("Datos"));
}
it("H5 doble validación solo envía una petición sin PII y descarta respuesta anterior a una edición", async () => {
  const deferred = Promise.withResolvers<Response>();
  const fetch = vi.spyOn(globalThis, "fetch").mockReturnValue(deferred.promise);
  await start(); fireEvent.click(screen.getByText("Validar")); fireEvent.click(screen.getByText("Validando"));
  expect(fetch).toHaveBeenCalledTimes(1); expect(screen.getByText("Validando")).toBeDisabled();
  expect(String(fetch.mock.calls[0][1]?.body)).not.toContain("Dirección sintética");
  fireEvent.click(screen.getByText("Editar"));
  const cart = validateCart(checkoutCatalog, cartInput, fingerprint).data;
  await act(async () => deferred.resolve(new Response(JSON.stringify({ ok: true, requestId: crypto.randomUUID(), data: cart }))));
  await screen.findByText("El borrador cambió durante la revisión. Vuelve a validarlo.");
  expect(screen.queryByText("ready")).not.toBeInTheDocument();
});
it("H5 storage bloqueado permite trabajo en memoria y advierte la falta de persistencia", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Bloqueado"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Bloqueado"); });
  await start();
  await waitFor(() => expect(screen.getByText(/No pudimos guardar los productos/)).toBeInTheDocument());
});
it("H5 sesión bloqueada conserva el carrito legible y exige revisar sus indicaciones", () => {
  const stored = serializeDraft(cartDraft, crypto.randomUUID());
  localStorage.setItem("fyb.cart.v1", stored.commercial);
  const originalGet = Storage.prototype.getItem;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
    if (this === sessionStorage) throw new Error("Sesión bloqueada");
    return originalGet.call(this, key);
  });
  const recovered = readDraft();
  expect(recovered.draft.lines).toHaveLength(1);
  expect(recovered.draft.lines[0]).toMatchObject({ lineId: cartLine.lineId, instructionsStatus: "needs_review" });
  expect(recovered.warning).toContain("datos de esta pestaña");
  expect(localStorage.getItem("fyb.cart.v1")).toBe(stored.commercial);
});
