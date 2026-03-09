import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Package } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getOrderById } from '@/services/orders';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DataTable } from '@/components/data-table';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return null;

  let order: Awaited<ReturnType<typeof getOrderById>>;
  try {
    order = await getOrderById(id, user.tenantId);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const customer = (order as { customer?: { id?: string; full_name?: string; email?: string; phone?: string } }).customer;
  const items = (order as { items?: Array<{ id: string; product_name_snapshot?: string; sku_snapshot?: string; quantity: number; unit_price: number; line_total: number; discount_amount?: number }> }).items ?? [];
  const deliveries = (order as { deliveries?: Array<{ id: string; status: string; delivery_type: string; scheduled_for?: string }> }).deliveries ?? [];

  const itemRows = items.map((item) => [
    <span key="name">{item.product_name_snapshot ?? '—'}</span>,
    <span key="sku" className="font-mono text-xs text-slate-500">{item.sku_snapshot ?? '—'}</span>,
    <span key="qty">{item.quantity}</span>,
    <span key="up">{brl(Number(item.unit_price))}</span>,
    <span key="total" className="font-medium">{brl(Number(item.line_total))}</span>,
  ]);

  const deliveryRows = deliveries.map((d) => [
    <Link key={d.id} href={`/admin/deliveries/${d.id}`} className="text-blue-600 hover:underline text-sm">
      {d.id.substring(0, 8).toUpperCase()}
    </Link>,
    <span key="type">{d.delivery_type}</span>,
    <StatusBadge key="status" status={d.status} />,
    <span key="sched" className="text-slate-500 text-xs">
      {d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString('pt-BR') : '—'}
    </span>,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.order_number}
        description={`Criado em ${new Date(order.created_at).toLocaleDateString('pt-BR')}`}
        action={
          <Btn href="/admin/orders" variant="secondary" icon={ArrowLeft}>
            Voltar
          </Btn>
        }
      />

      {/* Status badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status:</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Pagamento:</span>
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer info */}
        {customer && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <User size={14} />
              <span>Cliente</span>
            </div>
            <div>
              <Link
                href={`/admin/people/${customer.id}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                {customer.full_name}
              </Link>
              {customer.email && <p className="text-sm text-slate-500 mt-1">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            <Package size={14} />
            <span>Resumo Financeiro</span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{brl(Number(order.subtotal_amount ?? 0))}</dd>
            </div>
            {Number(order.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <dt className="text-slate-500">Desconto</dt>
                <dd className="text-red-600">- {brl(Number(order.discount_amount))}</dd>
              </div>
            )}
            {Number(order.delivery_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <dt className="text-slate-500">Frete</dt>
                <dd>{brl(Number(order.delivery_amount))}</dd>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <dt>Total</dt>
              <dd className="text-emerald-700">{brl(Number(order.total_amount ?? 0))}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Itens do Pedido</h2>
        <DataTable
          headers={['Produto', 'SKU', 'Qtd', 'Preço Unit.', 'Total Linha']}
          rows={itemRows}
          emptyMessage="Sem itens."
        />
      </div>

      {/* Action buttons */}
      {order.status === 'draft' && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">Este pedido está em rascunho. Confirme para processá-lo.</p>
          <form action={`/api/orders/${order.id}/confirm`} method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Confirmar Pedido
            </button>
          </form>
        </div>
      )}

      {/* Deliveries */}
      {deliveries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Entregas</h2>
          <DataTable
            headers={['ID', 'Tipo', 'Status', 'Agendado Para']}
            rows={deliveryRows}
            emptyMessage="Nenhuma entrega."
          />
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Observações</h2>
          <p className="text-sm text-slate-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
