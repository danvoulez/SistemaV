import Link from 'next/link';
import { requireMemberOrAdmin } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { Plus } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'paid', label: 'Pago' },
  { key: 'packed', label: 'Embalado' },
  { key: 'shipped', label: 'Enviado' },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function OpsOrdersPage({ searchParams }: Props) {
  const user = await requireMemberOrAdmin();
  const { status } = await searchParams;

  const allOrders = await getOrders(user.tenantId);

  // Exclude draft and cancelled
  const filtered = allOrders
    .filter((o) => o.status !== 'draft' && o.status !== 'cancelled')
    .filter((o) => !status || status === 'all' ? true : o.status === status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Pedidos ativos da operação (excluindo rascunhos e cancelados)."
        action={<Btn href="/ops/orders/new" icon={Plus}>Novo Pedido</Btn>}
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = (!status && tab.key === 'all') || status === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/ops/orders' : `/ops/orders?status=${tab.key}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <DataTable
        headers={['Nº Pedido', 'Cliente', 'Status', 'Pagamento', 'Total', 'Data']}
        emptyMessage="Nenhum pedido encontrado com os filtros selecionados."
        rows={filtered.map((o) => [
          <Link key="num" href={`/ops/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
            {o.order_number}
          </Link>,
          <span key="name">{(o as any).customer?.full_name ?? '—'}</span>,
          <StatusBadge key="status" status={o.status} />,
          <StatusBadge key="payment" status={o.payment_status ?? 'pending'} />,
          <span key="total">{fmt(o.total_amount ?? 0)}</span>,
          <span key="date">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>,
        ])}
      />

      <p className="text-xs text-slate-400">{filtered.length} pedido(s) encontrado(s)</p>
    </div>
  );
}
