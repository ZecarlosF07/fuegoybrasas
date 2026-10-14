import { redirect } from "next/navigation";

// Compatibilidad con enlaces previos: el acceso actual continúa al área del personal.
export default function LegacyStaffAccessPage() {
  redirect("/personal");
}
