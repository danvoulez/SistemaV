import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';
import { getDeliveries } from '@/services/deliveries';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

export default async function DeliveriesPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const deliveries = await getDeliveries(user.tenantId);

  const rows = deliveries.map((d) => {
    const order = (d as { order?: { id?: string; order_number?: string } }).order;
    const recipient = (d as { recipient?: { full_name?: string } }).recipient;
    return [
      <Link key={d.id} href={`/admin/deliveries/${d.id}`} className="font-mono text-blue-600 hover:underline text-xs">
        {d.id.substring(0, 8).toUpperCase()}
      </Link>,
      order?.order_number ? (
        <Link key="ord" href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">
          {order.order_number}
        </Link>
      ) : (
        <span key="ord">—</span>
      ),
      <span key="recipient">{recipient?.full_name ?? '—'}</span>,
      <span key="type" className="capitalize">{d.delivery_type ?? '—'}</span>,
      <StatusBadge key="status" status={d.status} />,
      <span key="sched" className="text-slate-500 text-xs">
        {d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString('pt-BR') : '—'}
      </span>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas"
        description="Acompanhe as entregas dos pedidos"
      />
      <DataTable
        headers={['ID', 'Pedido', 'Destinatário', 'Tipo', 'Status', 'Agendado Para']}
        rows={rows}
        emptyMessage="Nenhuma entrega encontrada."
      />
    </div>
  );
}
