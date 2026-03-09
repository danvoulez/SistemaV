import { Plus } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getBudgets } from '@/services/finance';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function BudgetsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const budgets = await getBudgets(user.tenantId);

  const rows = budgets.map((budget) => {
    const category = (budget as { category?: { name?: string } }).category;
    const allocated = Number(budget.allocated_amount ?? 0);
    const spent = Number(budget.spent_amount ?? 0);
    const pct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;
    const isOver = spent > allocated;

    return [
      <span key="name" className="font-medium text-slate-900">{budget.name}</span>,
      <span key="cat">{category?.name ?? '—'}</span>,
      <span key="alloc" className="font-medium">{brl(allocated)}</span>,
      <span key="spent" className={`font-medium ${isOver ? 'text-red-700' : 'text-slate-700'}`}>{brl(spent)}</span>,
      <div key="progress" className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${isOver ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>,
      <span key="period" className="text-xs text-slate-500">
        {new Date(budget.period_start).toLocaleDateString('pt-BR')} — {new Date(budget.period_end).toLocaleDateString('pt-BR')}
      </span>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Acompanhe os orçamentos por categoria"
        action={
          <Btn href="/admin/budgets/new" icon={Plus}>
            Novo Orçamento
          </Btn>
        }
      />
      <DataTable
        headers={['Nome', 'Categoria', 'Alocado', 'Gasto', 'Progresso', 'Período']}
        rows={rows}
        emptyMessage="Nenhum orçamento cadastrado."
      />
    </div>
  );
}
