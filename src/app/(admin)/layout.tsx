import { AccessDenied } from "@/features/staff/components/access-denied";
import { PrivateShell } from "@/features/staff/components/private-shell";
import { requireStaffPage } from "@/features/staff/server/access";
import type { ShellProps } from "@/features/staff/types/presentation";

export default async function AdministrationLayout({ children }: ShellProps) {
  const result = await requireStaffPage(true);
  if (!result.ok) return <AccessDenied message={result.error.message} />;
  return <PrivateShell access={result.data}>{children}</PrivateShell>;
}
