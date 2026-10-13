"use client";

import type { FormEvent } from "react";

import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { StaffEditorProps } from "../types/management";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { conservationSchema, staffChangeSchema } from "@/features/staff/validation/schemas";

export function StaffEditor({ employee, operation }: StaffEditorProps) {
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const parsed = staffChangeSchema.safeParse({ staffId: employee.id, expectedRevision: employee.revision, operationId: operation.journal?.operationId ?? crypto.randomUUID(), patch: { role: values.get("role"), active: values.get("active") === "on" } });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "staff")); return; }
    await operation.run("staff", parsed.data);
  }
  async function conserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = conservationSchema.safeParse({ entityType: "staff_account", entityId: employee.id, expectedRevision: employee.revision, operationId: operation.journal?.operationId ?? crypto.randomUUID(), reason: new FormData(event.currentTarget).get("reason") });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, employee.deleted ? "restore" : "delete")); return; }
    await operation.run(employee.deleted ? "restore" : "delete", parsed.data);
  }
  const conserveKind = employee.deleted ? "restore" : "delete";
  return <section className="space-y-4 rounded-card border border-brand-control-border bg-brand-surface p-4 md:p-6">
    <h2 className="break-all text-xl font-bold">Administrar acceso de {employee.email ?? "esta cuenta"}</h2>
    <p>El último responsable activo está protegido. Restaurar deja el acceso desactivado; necesita autorización posterior y MFA.</p>
    {!employee.deleted && <form method="post" onSubmit={save} noValidate className="space-y-4">
      <fieldset disabled={managementBlocked(operation, "staff") || employee.invitationStatus === "pending"} className="space-y-4">
        <SelectField id="role" name="role" label="Rol autorizado" defaultValue={employee.role}><option value="attendant">Atención</option><option value="manager">Responsable</option></SelectField>
        <CheckboxField id="active" name="active" label="Autorizar acceso activo" defaultChecked={employee.active} />
      </fieldset>
      <SubmitButton label="Guardar permisos" pendingLabel="Guardando permisos…" pending={operation.pending && operation.journal?.kind === "staff"} disabled={managementBlocked(operation, "staff") || employee.invitationStatus === "pending"} />
    </form>}
    <form method="post" onSubmit={conserve} noValidate className="space-y-4 border-t border-brand-border pt-4">
      <TextField id="reason" name="reason" label="Motivo del retiro o restauración" minLength={10} maxLength={500} required disabled={managementBlocked(operation, conserveKind)} />
      <SubmitButton label={employee.deleted ? "Restaurar cuenta sin activar" : "Retirar acceso de esta cuenta"} pendingLabel="Registrando cambio de acceso…" pending={operation.pending && operation.journal?.kind === conserveKind} disabled={managementBlocked(operation, conserveKind)} />
    </form>
  </section>;
}
