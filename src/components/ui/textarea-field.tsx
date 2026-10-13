import type { TextareaFieldProps } from "./types/field";

export function TextareaField({ id, label, help, error, ...props }: TextareaFieldProps) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="space-y-2">
    <label htmlFor={id} className="block font-semibold">{label}</label>
    <textarea {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} rows={4}
      className="min-h-12 w-full rounded-field border border-brand-control-border bg-brand-surface px-4 py-3 text-base text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action disabled:opacity-60" />
    {help && <p id={`${id}-help`} className="text-sm text-brand-muted">{help}</p>}{error && <p id={`${id}-error`} className="text-brand-danger">{error}</p>}
  </div>;
}
