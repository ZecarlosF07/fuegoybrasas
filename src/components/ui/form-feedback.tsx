"use client";

import { useEffect, useRef } from "react";

import { StatusMessage } from "./status-message";
import type { FormFeedbackProps } from "./types/form";

export function FormFeedback({ error, message }: FormFeedbackProps) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) summary.current?.focus(); }, [error]);
  if (!error) return message ? <StatusMessage tone="success">{message}</StatusMessage> : null;
  return <div ref={summary} tabIndex={-1} role="alert" className="rounded-field border border-brand-danger bg-brand-surface p-4 text-brand-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action">
    <p>{error.message}</p>
    {error.fieldErrors && <ul className="mt-2 list-inside list-disc">
      {Object.entries(error.fieldErrors).map(([field, messages]) => <li key={field}><a className="underline" href={`#${field.replace(/^patch\./, "")}`}>{messages[0]}</a></li>)}
    </ul>}
  </div>;
}
