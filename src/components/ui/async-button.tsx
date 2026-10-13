"use client";

import { useId, useRef, useState } from "react";

import { Button } from "./button";
import { StatusMessage } from "./status-message";
import type { AsyncButtonProps } from "./types/button";

export function AsyncButton({ action, disabled, label, pendingLabel, ...props }: AsyncButtonProps) {
  const errorId = useId();
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction() {
    if (running.current || disabled) return;
    running.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) setError(result.error.message);
    } catch {
      setError("No pudimos completar la acción. Intenta nuevamente.");
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button {...props} aria-busy={pending} aria-describedby={error ? errorId : undefined} disabled={disabled || pending} onClick={handleAction}>
        {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}
        {pending ? pendingLabel : label}
      </Button>
      {error && <StatusMessage id={errorId} tone="error">{error}</StatusMessage>}
    </div>
  );
}
