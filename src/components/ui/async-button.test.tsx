import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { AsyncButton } from "./async-button";
import { failure, success } from "@/contracts/services/result";
import type { Result } from "@/contracts/types/result";


it("muestra carga contextual en el control y rechaza doble ejecución", async () => {
  const operation = Promise.withResolvers<Result<void>>();
  const action = vi.fn(() => operation.promise);
  render(<AsyncButton label="Guardar" pendingLabel="Guardando…" action={action} />);
  const button = screen.getByRole("button", { name: "Guardar" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => operation.resolve(success(undefined, "request-1")));
  expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("muestra error explícito y permite reintentar", async () => {
  const action = vi.fn().mockResolvedValueOnce(failure({ code: "CONFLICT", message: "El registro cambió. Revisa los datos." }, "request-2"))
    .mockResolvedValueOnce(success(undefined, "request-3"));
  render(<AsyncButton label="Guardar" pendingLabel="Guardando…" action={action} />);
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El registro cambió");
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await act(async () => {});
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(action).toHaveBeenCalledTimes(2);
});

it("no expone una excepción técnica ni ejecuta un control deshabilitado", async () => {
  const action = vi.fn().mockRejectedValue(new Error("PRIVATE_DIAGNOSTIC"));
  const { rerender } = render(<AsyncButton label="Guardar" pendingLabel="Guardando…" disabled action={action} />);
  fireEvent.click(screen.getByRole("button"));
  expect(action).not.toHaveBeenCalled();
  rerender(<AsyncButton label="Guardar" pendingLabel="Guardando…" action={action} />);
  fireEvent.click(screen.getByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos completar");
  expect(screen.queryByText("PRIVATE_DIAGNOSTIC")).not.toBeInTheDocument();
});
