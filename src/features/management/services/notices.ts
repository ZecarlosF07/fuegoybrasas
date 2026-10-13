import type { ManagementKind } from "../types/management";

const NOTICES: Record<ManagementKind, string> = {
  reverse: "Sello corregido. El movimiento original permanece en el historial.",
  correct: "Datos corregidos por solicitud del cliente. Su contacto y progreso se conservan.",
  close: "Incidencia cerrada. El saldo y los premios no cambiaron.",
  staff: "Permisos guardados. Cada operación comprobará el acceso vigente y MFA.",
  delete: "Registro retirado. Se conserva su historial.",
  restore: "Registro restaurado sin reactivación automática. Revisa sus permisos y estado.",
  invite: "Invitación enviada y acceso asignado. El empleado debe completar contraseña y MFA.",
  reinstate: "Premio restituido en la misma tarjeta. El canje original se conserva y no se sumaron sellos.",
  recover: "Acceso recuperado. El enlace anterior quedó inválido; entrega el nuevo enlace únicamente al titular.",
  contingency: "Visita conciliada. Se conservó la fecha real de entrega y se registró un único sello.",
};
export function managementNotice(kind: ManagementKind, outcome: string) {
  return outcome === "review_required" ? "La corrección requiere revisión. Se registró una incidencia; el saldo y el canje no cambiaron." : NOTICES[kind];
}
