import { StaffPanel } from "@/features/management/components/staff-panel";
import { getManagedStaffAction } from "@/features/management/server/staff-actions";
import { requireStaffPage } from "@/features/staff/server/access";

export default async function ManagedStaffPage() {
  const access = await requireStaffPage(true);
  if (!access.ok) return <p role="alert">{access.error.message}</p>;
  const staff = await getManagedStaffAction();
  return staff.ok ? <StaffPanel initial={staff.data} actorUserId={access.data.authUserId} /> : <p role="alert">{staff.error.message}</p>;
}
