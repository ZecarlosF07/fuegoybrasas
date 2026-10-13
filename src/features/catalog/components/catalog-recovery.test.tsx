import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { CatalogRecovery } from "./catalog-recovery";
import { catalogFixture } from "../tests/fixtures";
import { CartProvider } from "@/features/cart/components/cart-provider";

vi.mock("@/lib/env/public", () => ({ getPublicEnvironment: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }) }));
afterEach(() => vi.restoreAllMocks());

it("recuperación consulta /api/catalog sin caché y bloquea doble ejecución", async () => {
  const deferred = Promise.withResolvers<Response>();
  const fetch = vi.spyOn(globalThis, "fetch").mockReturnValue(deferred.promise);
  render(<CartProvider><CatalogRecovery message="Servicio temporalmente no disponible" /></CartProvider>);
  const button = screen.getByRole("button", { name: "Volver a intentar" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Consultando la carta…" })).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("/api/catalog", { cache: "no-store", signal: expect.any(AbortSignal) });
  await act(async () => deferred.resolve(new Response(JSON.stringify({ ok: true, data: catalogFixture }))));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sabor que une,momentos que quedan.");
});

it("error explícito conserva reintento y recuperación de detalle mantiene su producto", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, data: catalogFixture })));
  render(<CartProvider><CatalogRecovery message="Servicio temporalmente no disponible" productSlug="gran-promocion" selectedSlug="promociones" /></CartProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar la carta");
  expect(screen.getByRole("button", { name: "Volver a intentar" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
  await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gran Promoción"));
  expect(screen.getByRole("link", { name: "Volver a la carta" })).toHaveAttribute("href", "/?categoria=promociones#carta");
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("snapshot vacío presenta el estado vacío y no simula productos", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true, data: { ...catalogFixture, items: [], categories: [] } })));
  render(<CartProvider><CatalogRecovery message="Servicio temporalmente no disponible" /></CartProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
  expect(await screen.findByText("Estamos preparando nuestra carta.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Categorías de la carta" })).not.toBeInTheDocument();
});
