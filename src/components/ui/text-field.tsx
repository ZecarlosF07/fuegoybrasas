import type { TextFieldProps } from "./types/field";

export function TextField({ className = "", error, help, id, label, ...props }: TextFieldProps) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="font-semibold">{label}</label>
      <input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy}
        className={`min-h-12 w-full rounded-field border border-brand-control-border bg-brand-surface px-4 py-3 text-base text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action disabled:cursor-not-allowed disabled:opacity-60 ${className}`} />
      {help && <p id={`${id}-help`} className="text-sm text-brand-muted">{help}</p>}
      {error && <p id={`${id}-error`} className="text-brand-danger">{error}</p>}
    </div>
  );
}
