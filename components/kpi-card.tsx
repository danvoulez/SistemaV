import { Kpi } from '@/types/domain';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  kpi: Kpi;
  icon?: React.ElementType;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-100 text-blue-600',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  amber: 'bg-amber-50 border-amber-100 text-amber-600',
  red: 'bg-red-50 border-red-100 text-red-600',
  purple: 'bg-purple-50 border-purple-100 text-purple-600',
  slate: 'bg-slate-50 border-slate-100 text-slate-600'
};

export function KpiCard({ kpi, icon: Icon, color = 'blue' }: KpiCardProps) {
  const trendPositive = kpi.trend?.startsWith('+');
  const trendNegative = kpi.trend?.startsWith('-');

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {kpi.trend && (
        <div className="flex items-center gap-1 mt-3">
          {trendPositive ? (
            <TrendingUp size={14} className="text-emerald-600" />
          ) : trendNegative ? (
            <TrendingDown size={14} className="text-red-600" />
          ) : (
            <Minus size={14} className="text-slate-400" />
          )}
          <span className={`text-xs font-medium ${trendPositive ? 'text-emerald-600' : trendNegative ? 'text-red-600' : 'text-slate-400'}`}>
            {kpi.trend}
          </span>
        </div>
      )}
    </div>
  );
}
