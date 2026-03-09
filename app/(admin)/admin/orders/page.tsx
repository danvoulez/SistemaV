import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Pago', value: 'paid' },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) return null;

  const { status } = await searchParams;
  const orders = await getOrders(user.tenantId, status || undefined);

  const rows = orders.map((o) => {
    const customer = (o as { customer?: { full_name?: string } }).customer;
    return [
      <Link key={o.id} href={`/admin/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
        {o.order_number}
      </Link>,
      <span key="cust">{customer?.full_name ?? '—'}</span>,
      <StatusBadge key="status" status={o.status} />,
      <StatusBadge key="pay" status={o.payment_status} />,
      <span key="total" className="font-medium">{brl(Number(o.total_amount ?? 0))}</span>,
      <span key="date" className="text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Gerencie os pedidos de venda"
        action={
          <Btn href="/admin/orders/new" icon={Plus}>
            Novo Pedido
          </Btn>
        }
      />

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/orders?status=${f.value}` : '/admin/orders'}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              (status ?? '') === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <DataTable
        headers={['Nº Pedido', 'Cliente', 'Status', 'Pagamento', 'Total', 'Data']}
        rows={rows}
        emptyMessage="Nenhum pedido encontrado."
      />
    </div>
  );
}
