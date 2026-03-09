import { Kpi } from '@/types/domain';

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-lg bg-white border p-4">
      <p className="text-sm text-slate-500">{kpi.label}</p>
      <p className="text-2xl font-semibold">{kpi.value}</p>
      {kpi.trend ? <p className="text-xs text-emerald-600">{kpi.trend}</p> : null}
    </div>
  );
}
