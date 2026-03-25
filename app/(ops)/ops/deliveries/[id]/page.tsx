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

type DeliveryView = Awaited<ReturnType<typeof getDeliveryById>> & {
  recipient?: { full_name?: string; email?: string; phone?: string };
  order?: { id: string; order_number?: string };
  events?: Array<{ id: string; event_type: string; description?: string; created_at: string }>;
  tracking_code?: string;
  dispatched_at?: string;
  delivered_at?: string;
};

export default async function OpsDeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireMemberOrAdmin();
  const { id } = await params;

  let delivery: DeliveryView;
  try {
    delivery = (await getDeliveryById(id, user.tenantId)) as DeliveryView;
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Entrega #${delivery.id.slice(0, 8).toUpperCase()}`} description={`Criada em ${new Date(delivery.created_at).toLocaleDateString('pt-BR')}`} action={<Btn href="/ops/deliveries" variant="secondary" icon={ArrowLeft}>Voltar</Btn>} />
      <div className="flex flex-wrap gap-3 items-center"><StatusBadge status={delivery.status} />{delivery.order && <Link href={`/ops/orders/${delivery.order.id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 rounded-full px-2.5 py-0.5"><ShoppingCart size={12} />{delivery.order.order_number}</Link>}</div>
      <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><User size={16} className="text-slate-400" /><h2 className="text-sm font-semibold text-slate-700">Destinatário</h2></div>{delivery.recipient ? <div className="space-y-1 text-sm text-slate-600"><p className="font-medium text-slate-900">{delivery.recipient.full_name}</p>{delivery.recipient.email && <p>{delivery.recipient.email}</p>}{delivery.recipient.phone && <p>{delivery.recipient.phone}</p>}</div> : <p className="text-sm text-slate-400">Sem informações de destinatário.</p>}</div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><MapPin size={16} className="text-slate-400" /><h2 className="text-sm font-semibold text-slate-700">Detalhes da Entrega</h2></div><div className="space-y-2 text-sm text-slate-600">{delivery.scheduled_for && <div className="flex justify-between"><span>Data Prevista</span><span>{new Date(delivery.scheduled_for).toLocaleDateString('pt-BR')}</span></div>}</div></div></div>
      <DeliveryStatusForm deliveryId={delivery.id} currentStatus={delivery.status} />
      <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-700 mb-4">Histórico de Eventos</h2><DeliveryTimeline events={delivery.events ?? []} /></div>
    </div>
  );
}
