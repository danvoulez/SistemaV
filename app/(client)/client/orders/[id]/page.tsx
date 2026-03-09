import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getOrderById } from '@/services/orders';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { ArrowLeft, Truck } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth('client');

  let order: any;
  try {
    order = await getOrderById(id, user.tenantId);
  } catch {
    notFound();
  }

  // Ensure this order belongs to the current client
  if (order.customer_person_id !== user.personId) {
    notFound();
  }

  const items: any[] = order.items ?? [];
  const deliveries: any[] = order.deliveries ?? [];

  return (
    <div className="space-y-6">
      <Btn variant="ghost" href="/client/orders" icon={ArrowLeft} size="sm">
        Voltar aos Pedidos
      </Btn>

      <PageHeader
        title={order.order_number}
        description={`Criado em ${new Date(order.created_at).toLocaleDateString('pt-BR')}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items + totals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Itens do Pedido</h3>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">Sem itens.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.product_name_snapshot}</p>
                      {item.sku_snapshot && (
                        <p className="text-xs text-slate-400">SKU: {item.sku_snapshot}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{fmt(Number(item.line_total ?? 0))}</p>
                      <p className="text-xs text-slate-400">
                        {item.quantity}x {fmt(Number(item.unit_price ?? 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{fmt(Number(order.subtotal_amount ?? 0))}</span>
              </div>
              {Number(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span>- {fmt(Number(order.discount_amount))}</span>
                </div>
              )}
              {Number(order.delivery_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Frete</span>
                  <span>{fmt(Number(order.delivery_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-3 mt-2 text-slate-900">
                <span>Total</span>
                <span>{fmt(Number(order.total_amount ?? 0))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Observações</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment info */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Pagamento</h3>
            <StatusBadge status={order.payment_status ?? 'pending'} />
            {order.payment_method && (
              <p className="text-sm text-slate-500 mt-2 capitalize">{order.payment_method}</p>
            )}
          </div>

          {/* Delivery status */}
          {deliveries.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Entregas</h3>
              <div className="space-y-2">
                {deliveries.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/client/deliveries/${d.id}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-xs text-slate-700">
                      <Truck size={12} className="text-slate-400" />
                      {d.delivery_type ?? 'Entrega'}
                    </span>
                    <StatusBadge status={d.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
