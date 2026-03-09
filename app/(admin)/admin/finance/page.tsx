import { Plus, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getFinanceEntries, getFinanceSummary, getFinanceCategories } from '@/services/finance';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { KpiCard } from '@/components/kpi-card';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function FinancePage() {
  const user = await getAuthUser();
  if (!user) return null;

  const [entries, summary] = await Promise.all([
    getFinanceEntries(user.tenantId, undefined, 50),
    getFinanceSummary(user.tenantId),
  ]);

  const entryRows = entries.map((entry) => {
    const category = entry.category;
    return [
      <span key="date" className="text-slate-500 text-xs">{new Date(entry.occurred_at).toLocaleDateString('pt-BR')}</span>,
      <span key="desc">{entry.description ?? '—'}</span>,
      <StatusBadge key="type" status={entry.type} />,
      <span key="cat">{category?.name ?? '—'}</span>,
      <span
        key="amount"
        className={`font-semibold ${entry.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}
      >
        {entry.type === 'income' ? '+' : '-'}{brl(Number(entry.amount))}
      </span>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas e saldo do mês corrente"
        action={
          <Btn href="/admin/finance/new" icon={Plus}>
            Novo Lançamento
          </Btn>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          kpi={{ label: 'Receitas do Mês', value: brl(summary.income) }}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          kpi={{ label: 'Despesas do Mês', value: brl(summary.expense) }}
          icon={TrendingDown}
          color="red"
        />
        <KpiCard
          kpi={{
            label: 'Saldo Líquido',
            value: brl(summary.net),
            trend: summary.net >= 0 ? `+${brl(summary.net)}` : brl(summary.net),
          }}
          icon={Scale}
          color={summary.net >= 0 ? 'blue' : 'amber'}
        />
      </div>

      {/* Entries table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Lançamentos Recentes</h2>
        <DataTable
          headers={['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor']}
          rows={entryRows}
          emptyMessage="Nenhum lançamento encontrado."
        />
      </div>
    </div>
  );
}
