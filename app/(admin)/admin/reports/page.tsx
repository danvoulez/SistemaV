import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { StatusBadge } from '@/components/status-badge';
import { BarChart3, TrendingUp } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default async function ReportsPage() {
  const user = await getAuthUser();
  const supabase = await createSupabaseServerClient();
  const tenantId = user?.tenantId ?? '';

  const [{ data: orders }, { data: deliveries }, { data: finance }, { data: people }] = await Promise.all([
    supabase.from('sales_orders').select('id,status,total_amount,payment_status,created_at').eq('tenant_id', tenantId),
    supabase.from('deliveries').select('id,status').eq('tenant_id', tenantId),
    supabase.from('finance_entries').select('id,type,amount,occurred_at').eq('tenant_id', tenantId),
    supabase.from('people').select('id,type,is_active').eq('tenant_id', tenantId)
  ]);

  const ordersByStatus = ['draft','confirmed','paid','cancelled','packed','shipped','delivered'].map((s) => {
    const group = (orders ?? []).filter((o) => o.status === s);
    return { status: s, count: group.length, total: group.reduce((acc, o) => acc + Number(o.total_amount), 0) };
  }).filter((g) => g.count > 0);

  const totalRevenue = (finance ?? []).filter((f) => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
  const totalExpense = (finance ?? []).filter((f) => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);
  const deliveredCount = (deliveries ?? []).filter((d) => d.status === 'delivered').length;
  const deliveryRate = (deliveries ?? []).length > 0 ? Math.round((deliveredCount / (deliveries ?? []).length) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Relatórios" description="Resumos e análises do negócio." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard kpi={{ label: 'Total de Pedidos', value: String((orders ?? []).length) }} icon={BarChart3} color="blue" />
        <KpiCard kpi={{ label: 'Receita Total', value: fmt(totalRevenue) }} icon={TrendingUp} color="emerald" />
        <KpiCard kpi={{ label: 'Despesas Totais', value: fmt(totalExpense) }} icon={TrendingUp} color="red" />
        <KpiCard kpi={{ label: 'Taxa de Entrega', value: `${deliveryRate}%` }} icon={BarChart3} color="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Pedidos por Status</h2>
          <DataTable
            headers={['Status', 'Qtd', 'Valor Total']}
            rows={ordersByStatus.map((g) => [
              <StatusBadge key={g.status} status={g.status} />,
              <span key={g.status} className="font-semibold">{g.count}</span>,
              fmt(g.total)
            ])}
            emptyMessage="Sem pedidos."
          />
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Entregas por Status</h2>
          <DataTable
            headers={['Status', 'Qtd']}
            rows={['pending','scheduled','in_transit','delivered','failed','returned'].map((s) => {
              const count = (deliveries ?? []).filter((d) => d.status === s).length;
              if (count === 0) return null;
              return [<StatusBadge key={s} status={s} />, <span key={s} className="font-semibold">{count}</span>];
            }).filter(Boolean) as React.ReactNode[][]}
            emptyMessage="Sem entregas."
          />
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Resumo Financeiro</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Receitas', value: fmt(totalRevenue), color: 'text-emerald-600' },
              { label: 'Total Despesas', value: fmt(totalExpense), color: 'text-red-600' },
              { label: 'Saldo Líquido', value: fmt(totalRevenue - totalExpense), color: totalRevenue >= totalExpense ? 'text-emerald-600' : 'text-red-600' }
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-slate-600">{r.label}</span>
                <span className={`font-semibold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Pessoas</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Cadastrado', value: (people ?? []).length },
              { label: 'Pessoa Física', value: (people ?? []).filter((p) => p.type === 'individual').length },
              { label: 'Empresas', value: (people ?? []).filter((p) => p.type === 'company').length },
              { label: 'Ativos', value: (people ?? []).filter((p) => p.is_active).length }
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-slate-600">{r.label}</span>
                <span className="font-semibold text-slate-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
