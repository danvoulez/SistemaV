import Link from 'next/link';
import { requireMemberOrAdmin } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import { getDeliveries } from '@/services/deliveries';
import { getTasks } from '@/services/tasks';
import { getNotes } from '@/services/notes';
import { KpiCard } from '@/components/kpi-card';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { ShoppingCart, Truck, CheckSquare, FileText } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const ACTIVE_STATUSES = ['confirmed', 'paid', 'packed', 'shipped'];

export default async function OpsDashboardPage() {
  const user = await requireMemberOrAdmin();
  const { tenantId, id: userId } = user;

  const [allOrders, allDeliveries, tasks, notes] = await Promise.all([
    getOrders(tenantId),
    getDeliveries(tenantId),
    getTasks(tenantId),
    getNotes(tenantId, userId),
  ]);

  const activeOrders = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pendingDeliveries = allDeliveries.filter((d) => d.status !== 'delivered' && d.status !== 'returned');
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const teamNotes = notes.filter((n) => n.visibility === 'team');

  const kpis = [
    { label: 'Pedidos Ativos', value: String(activeOrders.length), icon: ShoppingCart, color: 'blue' as const },
    { label: 'Entregas Pendentes', value: String(pendingDeliveries.length), icon: Truck, color: 'amber' as const },
    { label: 'Tarefas Abertas', value: String(openTasks.length), icon: CheckSquare, color: 'purple' as const },
    { label: 'Notas da Equipe', value: String(teamNotes.length), icon: FileText, color: 'emerald' as const },
  ];

  const recentActiveOrders = activeOrders.slice(0, 10);
  const recentPendingDeliveries = pendingDeliveries.slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel de Operações"
        description={`Bem-vindo, ${user.fullName}. Resumo das operações em andamento.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={{ label: k.label, value: k.value }} icon={k.icon} color={k.color} />
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Pedidos Ativos</h2>
          <Link href="/ops/orders" className="text-sm text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>
        <DataTable
          headers={['Nº Pedido', 'Cliente', 'Status', 'Total', 'Data']}
          emptyMessage="Nenhum pedido ativo no momento."
          rows={recentActiveOrders.map((o) => [
            <Link key={o.id} href={`/ops/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
              {o.order_number}
            </Link>,
            <span key="name">{(o as any).customer?.full_name ?? '—'}</span>,
            <StatusBadge key="status" status={o.status} />,
            <span key="total">{fmt(o.total_amount ?? 0)}</span>,
            <span key="date">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>,
          ])}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Entregas Pendentes</h2>
          <Link href="/ops/deliveries" className="text-sm text-blue-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <DataTable
          headers={['Pedido', 'Destinatário', 'Tipo', 'Status', 'Data Prevista']}
          emptyMessage="Nenhuma entrega pendente."
          rows={recentPendingDeliveries.map((d) => [
            <Link key={d.id} href={`/ops/deliveries/${d.id}`} className="font-medium text-blue-600 hover:underline">
              {(d as any).order?.order_number ?? '—'}
            </Link>,
            <span key="recipient">{(d as any).recipient?.full_name ?? '—'}</span>,
            <span key="type" className="capitalize">{d.delivery_type ?? '—'}</span>,
            <StatusBadge key="status" status={d.status} />,
            <span key="date">
              {d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString('pt-BR') : '—'}
            </span>,
          ])}
        />
      </section>
    </div>
  );
}
