import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getDeliveryById } from '@/services/deliveries';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DeliveryTimeline } from '@/components/delivery-timeline';
import { ArrowLeft, ShoppingCart, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDeliveryDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth('client');

  let delivery: any;
  try {
    delivery = await getDeliveryById(id, user.tenantId);
  } catch {
    notFound();
  }

  // Ensure this delivery belongs to the client's orders
  if (delivery.order?.customer_person_id && delivery.order.customer_person_id !== user.personId) {
    notFound();
  }

  const events: any[] = delivery.events ?? [];
  const order = delivery.order;

  return (
    <div className="space-y-6">
      <Btn variant="ghost" href="/client/deliveries" icon={ArrowLeft} size="sm">
        Voltar às Entregas
      </Btn>

      <PageHeader
        title={`Entrega #${id.slice(0, 8).toUpperCase()}`}
        description={order ? `Pedido: ${order.order_number}` : 'Detalhe da entrega'}
        action={<StatusBadge status={delivery.status} />}
      />

      {/* Order link */}
      {order && (
        <div className="flex items-center gap-2">
          <Link
            href={`/client/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <ShoppingCart size={14} />
            Ver pedido {order.order_number}
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery info */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800 text-sm">Informações da Entrega</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo</span>
              <span className="capitalize">{delivery.delivery_type ?? '—'}</span>
            </div>
            {delivery.scheduled_for && (
              <div className="flex justify-between">
                <span className="text-slate-500">Data Prevista</span>
                <span>{new Date(delivery.scheduled_for).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {delivery.dispatched_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Saiu para Entrega</span>
                <span>{new Date(delivery.dispatched_at).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {delivery.delivered_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Entregue em</span>
                <span>{new Date(delivery.delivered_at).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {delivery.tracking_code && (
              <div className="flex justify-between">
                <span className="text-slate-500">Código de Rastreio</span>
                <span className="font-mono text-xs">{delivery.tracking_code}</span>
              </div>
            )}
            {delivery.notes && (
              <div className="pt-3 mt-3 border-t">
                <p className="text-slate-500 text-xs mb-1">Observações</p>
                <p className="text-slate-700">{delivery.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Histórico de Atualizações</h3>
          <DeliveryTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
