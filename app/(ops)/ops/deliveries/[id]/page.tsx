import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMemberOrAdmin } from '@/lib/auth';
import { getDeliveryById } from '@/services/deliveries';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';
import { DeliveryTimeline } from '@/components/delivery-timeline';
import { ArrowLeft, User, ShoppingCart, MapPin } from 'lucide-react';
import { DeliveryStatusForm } from './delivery-status-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpsDeliveryDetailPage({ params }: Props) {
  const user = await requireMemberOrAdmin();
  const { id } = await params;

  let delivery: any;
  try {
    delivery = await getDeliveryById(id, user.tenantId);
  } catch {
    notFound();
  }

  const recipient = delivery.recipient;
  const order = delivery.order;
  const events: any[] = delivery.events ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Entrega #${delivery.id.slice(0, 8).toUpperCase()}`}
        description={`Criada em ${new Date(delivery.created_at).toLocaleDateString('pt-BR')}`}
        action={
          <Btn href="/ops/deliveries" variant="secondary" icon={ArrowLeft}>
            Voltar
          </Btn>
        }
      />

      {/* Status row */}
      <div className="flex flex-wrap gap-3 items-center">
        <StatusBadge status={delivery.status} />
        <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5 capitalize">
          {delivery.delivery_type ?? 'standard'}
        </span>
        {order && (
          <Link
            href={`/ops/orders/${order.id}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 rounded-full px-2.5 py-0.5"
          >
            <ShoppingCart size={12} />
            {order.order_number}
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recipient info */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Destinatário</h2>
          </div>
          {recipient ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{recipient.full_name}</p>
              {recipient.email && <p>{recipient.email}</p>}
              {recipient.phone && <p>{recipient.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sem informações de destinatário.</p>
          )}
        </div>

        {/* Delivery details */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Detalhes da Entrega</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Tipo</span>
              <span className="capitalize">{delivery.delivery_type ?? '—'}</span>
            </div>
            {delivery.scheduled_for && (
              <div className="flex justify-between">
                <span>Data Prevista</span>
                <span>{new Date(delivery.scheduled_for).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {delivery.dispatched_at && (
              <div className="flex justify-between">
                <span>Despachado em</span>
                <span>{new Date(delivery.dispatched_at).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {delivery.delivered_at && (
              <div className="flex justify-between">
                <span>Entregue em</span>
                <span>{new Date(delivery.delivered_at).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {delivery.tracking_code && (
              <div className="flex justify-between">
                <span>Código de Rastreio</span>
                <span className="font-mono text-xs">{delivery.tracking_code}</span>
              </div>
            )}
            {delivery.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-slate-500 text-xs mb-1">Observações</p>
                <p className="text-slate-700">{delivery.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status update form */}
      <DeliveryStatusForm
        deliveryId={delivery.id}
        currentStatus={delivery.status}
        userId={user.id}
      />

      {/* Timeline */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Histórico de Eventos</h2>
        <DeliveryTimeline events={events} />
      </div>
    </div>
  );
}
