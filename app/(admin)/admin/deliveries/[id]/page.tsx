import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, User } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getDeliveryById } from '@/services/deliveries';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DeliveryTimeline } from '@/components/delivery-timeline';

const STATUS_TRANSITIONS: Record<string, string | null> = {
  pending: 'scheduled',
  scheduled: 'in_transit',
  in_transit: 'delivered',
  delivered: null,
  failed: null,
  returned: null,
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Marcar como Agendado',
  in_transit: 'Marcar como Em Trânsito',
  delivered: 'Marcar como Entregue',
};

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return null;

  let delivery: Awaited<ReturnType<typeof getDeliveryById>>;
  try {
    delivery = await getDeliveryById(id, user.tenantId);
  } catch {
    notFound();
  }

  if (!delivery) notFound();

  const order = (delivery as { order?: { id?: string; order_number?: string; total_amount?: number } }).order;
  const recipient = (delivery as { recipient?: { id?: string; full_name?: string; phone?: string; email?: string } }).recipient;
  const events = (delivery as { events?: Array<{ id: string; event_type: string; description?: string; created_at: string }> }).events ?? [];

  const nextStatus = STATUS_TRANSITIONS[delivery.status] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Entrega ${delivery.id.substring(0, 8).toUpperCase()}`}
        description={`Tipo: ${delivery.delivery_type ?? '—'}`}
        action={
          <Btn href="/admin/deliveries" variant="secondary" icon={ArrowLeft}>
            Voltar
          </Btn>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status:</span>
          <StatusBadge status={delivery.status} />
        </div>
        {delivery.delivery_type && (
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-slate-400" />
            <span className="text-sm capitalize text-slate-700">{delivery.delivery_type}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order info */}
        {order && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pedido</h2>
            <div>
              <Link href={`/admin/orders/${order.id}`} className="font-semibold text-blue-600 hover:underline">
                {order.order_number}
              </Link>
              {order.total_amount != null && (
                <p className="text-sm text-slate-500 mt-1">
                  Total:{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total_amount))}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recipient info */}
        {recipient && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <User size={14} />
              <span>Destinatário</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{recipient.full_name}</p>
              {recipient.phone && <p className="text-sm text-slate-500 mt-1">{recipient.phone}</p>}
              {recipient.email && <p className="text-sm text-slate-500">{recipient.email}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Delivery dates */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Datas</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {delivery.scheduled_for && (
            <div>
              <dt className="text-xs text-slate-500">Agendado Para</dt>
              <dd className="text-sm font-medium mt-1">{new Date(delivery.scheduled_for).toLocaleDateString('pt-BR')}</dd>
            </div>
          )}
          {(delivery as { dispatched_at?: string }).dispatched_at && (
            <div>
              <dt className="text-xs text-slate-500">Despachado Em</dt>
              <dd className="text-sm font-medium mt-1">{new Date((delivery as { dispatched_at: string }).dispatched_at).toLocaleDateString('pt-BR')}</dd>
            </div>
          )}
          {(delivery as { delivered_at?: string }).delivered_at && (
            <div>
              <dt className="text-xs text-slate-500">Entregue Em</dt>
              <dd className="text-sm font-medium mt-1">{new Date((delivery as { delivered_at: string }).delivered_at).toLocaleDateString('pt-BR')}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Status action */}
      {nextStatus && (
        <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 flex items-center justify-between">
          <p className="text-sm text-blue-800">Atualizar o status desta entrega.</p>
          <form action={`/api/deliveries/${delivery.id}/status`} method="POST">
            <input type="hidden" name="status" value={nextStatus} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {STATUS_LABELS[nextStatus] ?? nextStatus}
            </button>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Histórico</h2>
        <DeliveryTimeline events={events} />
      </div>
    </div>
  );
}
