import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { TextField } from "./text-field";

it("asocia etiqueta, ayuda y error; conserva texto y foco al informar un error", () => {
  const { rerender } = render(<TextField id="name" label="Nombre" help="Como prefieres que te llamemos." />);
  const input = screen.getByRole("textbox", { name: "Nombre" });
  input.focus();
  fireEvent.change(input, { target: { value: "Ana" } });
  rerender(<TextField id="name" label="Nombre" help="Como prefieres que te llamemos." error="Revisa este dato." />);
  expect(input).toHaveValue("Ana");
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Como prefieres que te llamemos. Revisa este dato.");
});
