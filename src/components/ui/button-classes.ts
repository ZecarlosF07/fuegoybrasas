import type { ButtonVariant } from "./types/button";

const BASE_CLASSES = "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-button px-6 py-3 text-center font-semibold transition-colors duration-feedback ease-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-80 motion-reduce:transition-none";
const VARIANT_CLASSES = {
  primary: "border border-brand-primary-border bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover active:bg-brand-primary-hover focus-visible:outline-brand-action",
  secondary: "border border-brand-control-border bg-brand-surface text-brand-ink hover:bg-brand-subtle focus-visible:outline-brand-action",
  inverse: "border border-brand-surface bg-brand-action text-brand-surface hover:bg-brand-action-hover focus-visible:outline-brand-surface",
};

export function buttonClasses(variant: ButtonVariant) {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`;
}
