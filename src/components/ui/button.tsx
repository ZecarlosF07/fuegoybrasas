import { buttonClasses } from "./button-classes";
import type { ButtonProps } from "./types/button";

export function Button({ className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button {...props} type={type} className={`${buttonClasses(variant)} ${className}`} />;
}
