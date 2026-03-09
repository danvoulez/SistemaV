import { Plus, Landmark, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getBankAccounts, getTransactions } from '@/services/banking';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { KpiCard } from '@/components/kpi-card';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function BankingPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const [accounts, transactions] = await Promise.all([
    getBankAccounts(user.tenantId),
    getTransactions(user.tenantId, undefined, 30),
  ]);

  const txRows = transactions.map((tx) => {
    const account = (tx as { account?: { name?: string } }).account;
    const isIncome = tx.type === 'income';
    const isExpense = tx.type === 'expense';
    return [
      <span key="date" className="text-slate-500 text-xs">{new Date(tx.occurred_at).toLocaleDateString('pt-BR')}</span>,
      <span key="desc">{tx.description ?? '—'}</span>,
      <span key="type" className="inline-flex items-center gap-1">
        {isIncome ? <ArrowUpCircle size={14} className="text-emerald-600" /> : isExpense ? <ArrowDownCircle size={14} className="text-red-500" /> : <ArrowLeftRight size={14} className="text-indigo-500" />}
        <span className={isIncome ? 'text-emerald-700' : isExpense ? 'text-red-700' : 'text-indigo-700'}>
          {isIncome ? 'Receita' : isExpense ? 'Despesa' : 'Transferência'}
        </span>
      </span>,
      <span key="amount" className={`font-semibold ${isIncome ? 'text-emerald-700' : isExpense ? 'text-red-700' : 'text-slate-700'}`}>
        {isIncome ? '+' : isExpense ? '-' : ''}{brl(Number(tx.amount))}
      </span>,
      <span key="acct" className="text-slate-500 text-sm">{account?.name ?? '—'}</span>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie suas contas e movimentações"
        action={
          <div className="flex gap-2">
            <Btn href="/admin/banking/accounts/new" variant="secondary" size="sm">
              Nova Conta
            </Btn>
            <Btn href="/admin/banking/transactions/new" icon={Plus} size="sm">
              Nova Transação
            </Btn>
          </div>
        }
      />

      {/* KPI cards per account */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <KpiCard
              key={account.id}
              kpi={{
                label: account.name,
                value: brl(Number(account.current_balance ?? 0)),
              }}
              icon={Landmark}
              color={Number(account.current_balance ?? 0) >= 0 ? 'emerald' : 'red'}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-400 text-sm">
          Nenhuma conta bancária cadastrada.
        </div>
      )}

      {/* Recent transactions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Transações Recentes</h2>
        <DataTable
          headers={['Data', 'Descrição', 'Tipo', 'Valor', 'Conta']}
          rows={txRows}
          emptyMessage="Nenhuma transação encontrada."
        />
      </div>
    </div>
  );
}
