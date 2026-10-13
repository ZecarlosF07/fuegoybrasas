import type { ButtonVariant } from "./types/button";

const BASE_CLASSES = "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-button px-6 py-3 text-center font-semibold transition-colors duration-feedback ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action disabled:cursor-not-allowed disabled:opacity-80 motion-reduce:transition-none";
const VARIANT_CLASSES = {
  primary: "bg-brand-action text-brand-surface hover:bg-brand-action-hover active:bg-brand-action-hover",
  secondary: "border border-brand-control-border bg-brand-surface text-brand-action hover:bg-brand-bg",
};

export function buttonClasses(variant: ButtonVariant) {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`;
}
