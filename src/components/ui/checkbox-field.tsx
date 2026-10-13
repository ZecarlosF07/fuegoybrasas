import type { CheckboxFieldProps } from "./types/form";

export function CheckboxField({ label, help, id, ...props }: CheckboxFieldProps) {
  return <div><label htmlFor={id} className="flex min-h-12 items-center gap-3">
    <input {...props} id={id} type="checkbox" className="h-6 w-6 shrink-0 accent-brand-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action" aria-describedby={help ? `${id}-help` : undefined} />
    <span>{label}</span>
  </label>{help && <p id={`${id}-help`} className="text-sm text-brand-muted">{help}</p>}</div>;
}
