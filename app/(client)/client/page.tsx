import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { KpiCard } from '@/components/kpi-card';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { ShoppingCart, Truck, CheckCircle, AlertCircle } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default async function ClientDashboardPage() {
  const user = await requireAuth('client');

  if (!user.personId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4">
          <AlertCircle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Perfil não configurado</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Sua conta ainda não está vinculada a um perfil de cliente. Entre em contato com o suporte para configurar seu acesso.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const [ordersResult, deliveriesResult] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('id, order_number, status, payment_status, total_amount, created_at')
      .eq('tenant_id', user.tenantId)
      .eq('customer_person_id', user.personId)
      .order('created_at', { ascending: false }),
    supabase
      .from('deliveries')
      .select('id, status, delivery_type, scheduled_for, created_at, order:sales_orders!order_id(order_number, customer_person_id)')
      .eq('tenant_id', user.tenantId)
      .order('created_at', { ascending: false }),
  ]);

  const orders = ordersResult.data ?? [];
  const allDeliveries = (deliveriesResult.data ?? []) as any[];

  // Filter deliveries belonging to this person's orders
  const myDeliveries = allDeliveries.filter(
    (d) => d.order?.customer_person_id === user.personId
  );

  const pendingDeliveries = myDeliveries.filter(
    (d) => !['delivered', 'returned', 'failed'].includes(d.status)
  );
  const paidOrders = orders.filter((o) => o.payment_status === 'paid');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meu Painel"
        description={`Bem-vindo(a), ${user.fullName.split(' ')[0]}! Acompanhe seus pedidos e entregas.`}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          kpi={{ label: 'Meus Pedidos', value: String(orders.length) }}
          icon={ShoppingCart}
          color="blue"
        />
        <KpiCard
          kpi={{ label: 'Entregas Pendentes', value: String(pendingDeliveries.length) }}
          icon={Truck}
          color="amber"
        />
        <KpiCard
          kpi={{ label: 'Pedidos Pagos', value: String(paidOrders.length) }}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-800 text-sm">Pedidos Recentes</h2>
            <Link href="/client/orders" className="text-sm text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="divide-y">
            {orders.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                href={`/client/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{o.order_number}</p>
                  <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-slate-700">{fmt(Number(o.total_amount ?? 0))}</span>
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Nenhum pedido ainda.</p>
            )}
          </div>
        </div>

        {/* Recent deliveries */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-800 text-sm">Entregas Recentes</h2>
            <Link href="/client/deliveries" className="text-sm text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y">
            {myDeliveries.slice(0, 3).map((d) => (
              <Link
                key={d.id}
                href={`/client/deliveries/${d.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {d.order?.order_number ?? `#${d.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">{d.delivery_type ?? '—'}</p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
            {myDeliveries.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Nenhuma entrega ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
