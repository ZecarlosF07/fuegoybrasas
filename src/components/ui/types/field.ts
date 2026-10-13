import type { ComponentProps } from "react";

export type TextFieldProps = Omit<ComponentProps<"input">, "id" | "aria-describedby" | "aria-invalid"> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};

export type TextareaFieldProps = Omit<ComponentProps<"textarea">, "id" | "aria-describedby" | "aria-invalid"> & {
  id: string; label: string; help?: string; error?: string;
};
