import type { DashboardMetricsProps } from "../types/management";

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return <dl className="grid grid-cols-2 gap-3 xl:grid-cols-3">
    {metrics.map(({ label, value }) => <div key={label} className="flex min-w-0 flex-col rounded-card border border-brand-border bg-brand-surface p-3 md:p-4">
      <dt className="grow text-sm leading-6 text-brand-muted">{label}</dt>
      <dd className="mt-2 text-3xl font-bold tabular-nums text-brand-action">{value}</dd>
    </div>)}
  </dl>;
}
