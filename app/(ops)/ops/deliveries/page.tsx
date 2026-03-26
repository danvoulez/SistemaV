import Link from 'next/link';
import { requireMemberOrAdmin } from '@/lib/auth';
import { getDeliveries } from '@/services/deliveries';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Truck, Calendar } from 'lucide-react';

interface DeliveryGroup {
  key: string;
  label: string;
  color: string;
}

const GROUPS: DeliveryGroup[] = [
  { key: 'pending', label: 'Pendentes', color: 'border-amber-300 bg-amber-50' },
  { key: 'scheduled', label: 'Agendadas', color: 'border-blue-300 bg-blue-50' },
  { key: 'in_transit', label: 'Em Trânsito', color: 'border-indigo-300 bg-indigo-50' },
];

export default async function OpsDeliveriesPage() {
  const user = await requireMemberOrAdmin();

  const deliveries = await getDeliveries(user.tenantId);

  // Filter non-completed
  const active = deliveries.filter((d) => !['delivered', 'returned', 'failed'].includes(d.status));

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: active.filter((d) => d.status === g.key),
  }));

  const totalActive = active.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas"
        description={`${totalActive} entrega(s) ativa(s) no momento.`}
      />

      {totalActive === 0 ? (
        <EmptyState
          title="Nenhuma entrega ativa"
          description="Não há entregas pendentes, agendadas ou em trânsito."
          icon={Truck}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">{group.label}</h2>
                <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.length === 0 ? (
                  <div className={`rounded-xl border-2 border-dashed p-6 text-center text-sm text-slate-400 ${group.color}`}>
                    Nenhuma entrega
                  </div>
                ) : (
                  group.items.map((d) => {
                    const order = d.order;
                    const recipient = d.recipient;
                    return (
                      <Link key={d.id} href={`/ops/deliveries/${d.id}`}>
                        <div className={`rounded-xl border-2 p-4 hover:shadow-md transition-shadow cursor-pointer ${group.color}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-medium text-slate-900 text-sm">
                              {order?.order_number ?? `Entrega #${d.id.slice(0, 8)}`}
                            </span>
                            <StatusBadge status={d.status} />
                          </div>
                          {recipient && (
                            <p className="text-xs text-slate-600 mb-1">{recipient.full_name}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                            <span className="capitalize">{d.delivery_type ?? '—'}</span>
                            {d.scheduled_for && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(d.scheduled_for).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
