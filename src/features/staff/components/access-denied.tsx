import { AccessShell } from "@/features/identity/components/access-shell";
import { SignOut } from "@/features/identity/components/sign-out";
import type { AccessDeniedProps } from "@/features/staff/types/presentation";

export function AccessDenied({ message }: AccessDeniedProps) {
  return <AccessShell><h1 className="font-brand text-3xl font-bold">Acceso no disponible</h1>
    <p role="alert" className="my-6">{message}</p>
    <SignOut />
  </AccessShell>;
}
