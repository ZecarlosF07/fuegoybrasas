import type { ReactNode } from "react";

import type { StaffAccess } from "./staff";

export type ShellProps = { children: ReactNode };
export type PrivateShellProps = ShellProps & { access: StaffAccess };
export type StaffNavigationProps = { manager: boolean };
export type AccessDeniedProps = { message: string };
