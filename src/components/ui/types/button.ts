import type { ComponentProps } from "react";

import type { Result } from "@/contracts/types/result";

export type ButtonVariant = "primary" | "secondary";
export type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };
export type AsyncButtonProps = Omit<ButtonProps, "onClick" | "children" | "type"> & {
  label: string;
  pendingLabel: string;
  action: () => Promise<Result<void>>;
};
