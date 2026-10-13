import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

import { OpenCardLink, SaveCardLink } from "./card-link";

const mocks = vi.hoisted(() => ({ open: vi.fn(), share: vi.fn() }));
vi.mock("../server/card-access-actions", () => ({ openCardLinkAction: mocks.open, getPrivateCardLinkAction: mocks.share }));
beforeEach(() => { vi.resetAllMocks(); window.history.replaceState(null, "", "/mi-tarjeta/acceso"); });
it("retira el secreto de la URL también en StrictMode y exige apertura explícita", async () => {
  window.history.replaceState(null, "", "/mi-tarjeta/acceso#tarjeta=" + "a".repeat(64));
  render(<StrictMode><OpenCardLink /></StrictMode>);
  await waitFor(() => expect(screen.getByRole("button", { name: "Abrir mi tarjeta" })).toBeVisible());
  expect(window.location.hash).toBe(""); expect(mocks.open).not.toHaveBeenCalled();
});
it("un teléfono en el fragmento no habilita acceso ni solicitudes automáticas", async () => {
  window.history.replaceState(null, "", "/mi-tarjeta/acceso#tarjeta=999000001");
  render(<OpenCardLink />);
  await waitFor(() => expect(window.location.hash).toBe(""));
  expect(screen.queryByRole("button")).not.toBeInTheDocument(); expect(mocks.open).not.toHaveBeenCalled();
  expect(screen.getByText(/escribir tu teléfono no recupera/)).toBeVisible();
});
it("un segundo enlace en la misma página retira el fragmento y sustituye solo la clave pendiente", async () => {
  window.history.replaceState(null, "", "/mi-tarjeta/acceso#tarjeta=" + "a".repeat(64));
  mocks.open.mockResolvedValue({ ok: false, error: { code: "AUTH_REQUIRED", message: "Enlace anterior inválido" }, requestId: "fixture" });
  render(<StrictMode><OpenCardLink /></StrictMode>);
  fireEvent.click(await screen.findByRole("button", { name: "Abrir mi tarjeta" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Enlace anterior inválido"));
  window.history.replaceState(null, "", "/mi-tarjeta/acceso#tarjeta=" + "b".repeat(64));
  fireEvent(window, new HashChangeEvent("hashchange"));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(window.location.hash.length).toBe(0);
  expect(mocks.open).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Abrir mi tarjeta" }));
  await waitFor(() => expect(mocks.open).toHaveBeenLastCalledWith("b".repeat(64)));
});
it("conserva el enlace preparado si el navegador rechaza copiar y no anuncia éxito", async () => {
  const copy = vi.fn().mockRejectedValue(new Error("Permiso denegado"));
  Object.defineProperty(navigator, "clipboard", { value: { writeText: copy }, configurable: true });
  const link = "https://example.test/mi-tarjeta/acceso#tarjeta=" + "a".repeat(64);
  mocks.share.mockResolvedValue({ ok: true, data: { link, qr: "data:image/png;base64,aQ==" }, requestId: "fixture" });
  render(<SaveCardLink />); fireEvent.click(screen.getByRole("button", { name: "Copiar enlace y mostrar QR" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("no se pudo copiar"));
  expect(screen.getByLabelText("Enlace privado de mi tarjeta")).toHaveValue(link);
  expect(screen.queryByText(/Enlace copiado/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copiar enlace y mostrar QR" })).toBeEnabled();
});
