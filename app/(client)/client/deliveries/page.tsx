import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { AlertCircle, Truck } from 'lucide-react';

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  pickup: 'Retirada',
  local_delivery: 'Entrega Local',
  courier: 'Transportadora',
  express: 'Expresso',
};

export default async function ClientDeliveriesPage() {
  const user = await requireAuth('client');

  if (!user.personId) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <AlertCircle size={20} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700">
          Perfil não configurado. Contacte o administrador.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  // Fetch deliveries linked to orders belonging to this person
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select(`
      id, status, delivery_type, scheduled_for, created_at,
      order:sales_orders!order_id(id, order_number, customer_person_id)
    `)
    .eq('tenant_id', user.tenantId)
    .order('created_at', { ascending: false });

  type DeliveryRow = {
    id: string;
    status: string;
    delivery_type: string | null;
    scheduled_for: string | null;
    created_at: string;
    order?: { id: string; order_number: string; customer_person_id: string };
  };

  // Filter only deliveries for this person's orders
  const myDeliveries = ((deliveries ?? []) as any as DeliveryRow[]).filter(
    (d) => d.order?.customer_person_id === user.personId
  );

  const rows = myDeliveries.map((d) => [
    <Link key="id" href={`/client/deliveries/${d.id}`} className="font-medium text-blue-600 hover:underline">
      #{d.id.slice(0, 8).toUpperCase()}
    </Link>,
    <span key="order">{d.order?.order_number ?? '—'}</span>,
    <StatusBadge key="status" status={d.status} />,
    <span key="type">{DELIVERY_TYPE_LABELS[d.delivery_type ?? ''] ?? (d.delivery_type ?? '—')}</span>,
    <span key="date">{d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString('pt-BR') : '—'}</span>,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Entregas"
        description={`${myDeliveries.length} entrega(s) encontrada(s).`}
      />

      {myDeliveries.length === 0 ? (
        <EmptyState
          title="Nenhuma entrega"
          description="Suas entregas aparecerão aqui quando seus pedidos forem processados."
          icon={Truck}
        />
      ) : (
        <DataTable
          headers={['ID', 'Pedido', 'Status', 'Tipo', 'Data Prevista']}
          rows={rows}
        />
      )}
    </div>
  );
}
