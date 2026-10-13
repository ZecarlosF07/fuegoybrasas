"use client";

import { useRef, useState } from "react";

import type { WorkResult } from "../types/form";
import type { OperationError } from "@/contracts/types/result";
import type { StaffConflict } from "@/features/staff/types/staff";

export function useServerWork<T>() {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OperationError<StaffConflict> | null>(null);
  async function execute(work: () => Promise<WorkResult<T>>) {
    if (running.current) return null;
    running.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await work();
      if (!result.ok) setError(result.error);
      return result;
    } catch {
      setError({ code: "OPERATION_UNCERTAIN", message: "No pudimos comprobar el resultado. Conserva esta pantalla e intenta consultar la operación." });
      return null;
    } finally { running.current = false; setPending(false); }
  }
  return { pending, error, execute, setError };
}
