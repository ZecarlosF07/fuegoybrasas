import type { SelectFieldProps } from "./types/form";

export function SelectField({ id, label, help, error, children, ...props }: SelectFieldProps) {
  return <div className="space-y-2">
    <label htmlFor={id} className="block font-semibold">{label}</label>
    <select {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
      className="min-h-12 w-full rounded-field border border-brand-control-border bg-brand-surface px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action disabled:opacity-60">{children}</select>
    {help && <p id={`${id}-help`} className="text-sm text-brand-muted">{help}</p>}
    {error && <p id={`${id}-error`} className="text-brand-danger">{error}</p>}
  </div>;
}
