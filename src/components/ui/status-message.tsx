import type { StatusMessageProps } from "./types/feedback";

const TONE_CLASSES = { error: "text-brand-danger", info: "text-brand-info", success: "text-brand-success" };

export function StatusMessage({ children, id, tone = "info" }: StatusMessageProps) {
  return (
    <p id={id} role={tone === "error" ? "alert" : "status"} className={`rounded-field bg-brand-surface p-4 ${TONE_CLASSES[tone]}`}>
      {children}
    </p>
  );
}
