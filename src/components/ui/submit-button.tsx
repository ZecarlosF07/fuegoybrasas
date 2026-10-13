"use client";

import { useSyncExternalStore } from "react";

import { Button } from "./button";
import type { SubmitButtonProps } from "./types/form";

const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;

export function SubmitButton({ pending, label, pendingLabel, disabled }: SubmitButtonProps) {
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  return <Button type="submit" disabled={!hydrated || pending || disabled} aria-busy={pending} className="w-full">
    {pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
    {pending ? pendingLabel : label}
  </Button>;
}
