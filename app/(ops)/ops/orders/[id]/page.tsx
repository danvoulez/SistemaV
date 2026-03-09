import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMemberOrAdmin } from '@/lib/auth';
import { getOrderById } from '@/services/orders';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { ArrowLeft, User, Package, Truck } from 'lucide-react';
import { OpsOrderActions } from './order-actions';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpsOrderDetailPage({ params }: Props) {
  const user = await requireMemberOrAdmin();
  const { id } = await params;

  let order: any;
  try {
    order = await getOrderById(id, user.tenantId);
  } catch {
    notFound();
  }

  const customer = order.customer;
  const items: any[] = order.items ?? [];
  const deliveries: any[] = order.deliveries ?? [];
  const firstDelivery = deliveries[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pedido ${order.order_number}`}
        description={`Criado em ${new Date(order.created_at).toLocaleDateString('pt-BR')}`}
        action={
          <Btn href="/ops/orders" variant="secondary" icon={ArrowLeft}>
            Voltar
          </Btn>
        }
      />

      {/* Status row */}
      <div className="flex flex-wrap gap-3 items-center">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.payment_status ?? 'pending'} />
        {order.payment_method && (
          <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
            {order.payment_method}
          </span>
        )}
        {firstDelivery && (
          <Link
            href={`/ops/deliveries/${firstDelivery.id}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 rounded-full px-2.5 py-0.5"
          >
            <Truck size={12} />
            Ver entrega
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer info */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Cliente</h2>
          </div>
          {customer ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{customer.full_name}</p>
              {customer.email && <p>{customer.email}</p>}
              {customer.phone && <p>{customer.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sem informações de cliente.</p>
          )}
        </div>

        {/* Order summary */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Resumo Financeiro</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal_amount ?? 0)}</span>
            </div>
            {(order.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto</span>
                <span>- {fmt(order.discount_amount)}</span>
              </div>
            )}
            {(order.delivery_amount ?? 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Frete</span>
                <span>{fmt(order.delivery_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-slate-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span>{fmt(order.total_amount ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Entrega</h2>
          </div>
          {firstDelivery ? (
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Status</span>
                <StatusBadge status={firstDelivery.status} />
              </div>
              <div className="flex justify-between">
                <span>Tipo</span>
                <span className="capitalize">{firstDelivery.delivery_type ?? '—'}</span>
              </div>
              {firstDelivery.scheduled_for && (
                <div className="flex justify-between">
                  <span>Data Prevista</span>
                  <span>{new Date(firstDelivery.scheduled_for).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              <Link href={`/ops/deliveries/${firstDelivery.id}`} className="text-blue-600 hover:underline text-xs mt-2 inline-block">
                Ver detalhes da entrega →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma entrega vinculada.</p>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-slate-700">Itens do Pedido</h2>
        </div>
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">Nenhum item encontrado.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Qtd</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço Unit.</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Desconto</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800 font-medium">{item.product_name_snapshot ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{item.sku_snapshot ?? '—'}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{fmt(item.unit_price ?? 0)}</td>
                  <td className="px-5 py-3 text-right text-red-600">
                    {(item.discount_amount ?? 0) > 0 ? `- ${fmt(item.discount_amount)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">{fmt(item.line_total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Observações</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Status actions */}
      <OpsOrderActions orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
