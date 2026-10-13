import type { ManagementFeedbackProps } from "../types/management";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";

export function ManagementFeedback({ operation }: ManagementFeedbackProps) {
  return <div className="space-y-4">
    <FormFeedback error={operation.error} message={operation.message} />
    {operation.journal && <div className="space-y-3 rounded-card border border-brand-control-border bg-brand-surface p-4">
      <p>Hay una intervención pendiente. Comprueba su resultado antes de realizar otra.</p>
      <p className="break-all text-sm">Referencia: {operation.journal.operationId}</p>
      <Button onClick={operation.check} disabled={operation.pending} aria-busy={operation.pending}>{operation.pending ? "Comprobando intervención…" : "Comprobar intervención"}</Button>
    </div>}
  </div>;
}
