import { StaffNavigation } from "./staff-navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { SignOut } from "@/features/identity/components/sign-out";
import type { PrivateShellProps } from "@/features/staff/types/presentation";

export function PrivateShell({ access, children }: PrivateShellProps) {
  return <div className="min-h-dvh">
    <header className="bg-brand-action text-brand-surface"><div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
      <BrandMark href="/personal" subtitle={access.role === "manager" ? "Responsable" : "Atención"} />
      <SignOut variant="inverse" />
    </div>
    </header>
    <div className="mx-auto grid max-w-content items-start gap-6 px-4 py-6 md:px-6 lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-8 lg:px-8">
      <div className="min-w-0 lg:sticky lg:top-6"><StaffNavigation manager={access.role === "manager"} /></div>
      <main id="contenido" tabIndex={-1} className="min-w-0 focus:outline-none">{children}</main>
    </div>
  </div>;
}
