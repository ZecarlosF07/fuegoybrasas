import { IncidentsPanel } from "@/features/management/components/incidents-panel";
import { getIncidents } from "@/features/management/server/reads";
import { requireStaffPage } from "@/features/staff/server/access";

export default async function IncidentsPage() {
  const access = await requireStaffPage(true);
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const result = await getIncidents({});
  return result.ok ? <IncidentsPanel initial={result.data} actorUserId={access.data.authUserId} /> : <p role="alert">{result.error.message}</p>;
}
