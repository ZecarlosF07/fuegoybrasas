import { AccessShell } from "@/features/identity/components/access-shell";
import type { ShellProps } from "@/features/staff/types/presentation";

export default function StaffAccessLayout({ children }: ShellProps) { return <AccessShell>{children}</AccessShell>; }
