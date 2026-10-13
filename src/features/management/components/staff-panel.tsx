"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ManagementFeedback } from "./operation-feedback";
import { StaffEditor } from "./staff-editor";
import { useManagementOperation } from "../hooks/use-management-operation";
import { getManagedStaffAction } from "../server/staff-actions";
import { managementFormError } from "../services/forms";
import { managementBlocked } from "../services/journal";
import type { StaffPanelProps } from "../types/management";
import { invitationSchema } from "../validation/schemas";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export function StaffPanel({ initial, actorUserId }: StaffPanelProps) {
  const [staff, setStaff] = useState(initial.staff);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  async function reload() {
    const result = await getManagedStaffAction();
    if (!result.ok) throw new Error("No pudimos consultar el personal actual.");
    setStaff(result.data.staff);
  }
  const operation = useManagementOperation(actorUserId, reload);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const parsed = invitationSchema.safeParse({ email: values.get("email"), role: values.get("invitationRole"), operationId: operation.journal?.operationId ?? crypto.randomUUID() });
    if (!parsed.success) { operation.setError(managementFormError(parsed.error, "invite")); return; }
    await operation.run("invite", parsed.data);
  }
  const selected = staff.find((employee) => employee.id === selectedId);
  return <div className="space-y-6">
    <h1 className="font-brand text-3xl font-bold">Personal y permisos</h1><p>Usa cuentas individuales. Cada empleado completa su contraseña y MFA antes de operar.</p>
    <ManagementFeedback operation={operation} />
    <form method="post" onSubmit={invite} noValidate className="space-y-4 rounded-card border border-brand-border bg-brand-surface p-4 md:p-6">
      <h2 className="text-xl font-bold">Invitar personal</h2><p>Si el correo o la asignación quedan incompletos, conserva esta referencia y comprueba la misma invitación. Nunca se activa una cuenta pendiente.</p>
      <fieldset disabled={managementBlocked(operation, "invite")} className="space-y-4">
        <TextField id="email" name="email" type="email" autoComplete="off" label="Correo del empleado" maxLength={254} required />
        <SelectField id="invitationRole" name="invitationRole" label="Rol inicial"><option value="attendant">Atención</option><option value="manager">Responsable</option></SelectField>
      </fieldset>
      <SubmitButton label={operation.journal?.kind === "invite" ? "Conciliar la misma invitación" : "Enviar invitación"} pendingLabel="Preparando y verificando invitación…" pending={operation.pending && operation.journal?.kind === "invite"} disabled={managementBlocked(operation, "invite")} />
    </form>
    <ul className="grid gap-4 lg:grid-cols-2">{staff.map((employee) => <li key={employee.id} className="space-y-3 rounded-card border border-brand-border bg-brand-surface p-4">
      <h2 className="break-all text-xl font-bold">{employee.email ?? employee.id}</h2><p>{employee.role === "manager" ? "Responsable" : "Atención"} · {employee.deleted ? "Retirado" : employee.active ? "Acceso autorizado; requiere MFA" : "Acceso desactivado"}</p>
      {employee.invitationStatus === "pending" && <p>Invitación incompleta. Sin acceso activo; conciliar con la misma referencia.</p>}
      {employee.invitationStatus === "sent" && <p>Invitación enviada; el empleado debe completar su acceso.</p>}
      <Button variant="secondary" disabled={operation.pending || operation.journal !== null} onClick={() => setSelectedId(employee.id)}>Administrar permisos</Button>
    </li>)}</ul>
    {selected && <StaffEditor key={selected.id + ":" + selected.revision} employee={selected} operation={operation} />}
  </div>;
}
