import type { ReactNode } from "react";

export type FeedbackTone = "error" | "info" | "success";
export type StatusMessageProps = { children: ReactNode; id?: string; tone?: FeedbackTone };
