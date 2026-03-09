import { KpiCard } from '@/components/kpi-card';
import { getAdminDashboardStats } from '@/services/dashboard';
import { getAuthUser } from '@/lib/auth';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';
import {
  ShoppingCart, Truck, TrendingUp, TrendingDown, AlertTriangle,
  ClipboardList, DollarSign, BarChart3, Bot
} from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  const tenantId = user?.tenantId ?? '';

  const stats = await getAdminDashboardStats(tenantId).catch(() => ({
    totalSales: 0, totalOrders: 0, pendingDeliveries: 0,
    revenue: 0, expense: 0, lowStockItems: 0, activeTasks: 0,
    recentOrders: [], recentDeliveries: []
  }));

  const kpis = [
    { label: 'Total de Vendas', value: fmt(stats.totalSales), icon: DollarSign, color: 'emerald' as const },
    { label: 'Total de Pedidos', value: String(stats.totalOrders), icon: ShoppingCart, color: 'blue' as const },
    { label: 'Entregas Pendentes', value: String(stats.pendingDeliveries), icon: Truck, color: 'amber' as const },
    { label: 'Receita do Mês', value: fmt(stats.revenue), icon: TrendingUp, color: 'emerald' as const },
    { label: 'Despesas do Mês', value: fmt(stats.expense), icon: TrendingDown, color: 'red' as const },
    { label: 'Estoque Baixo', value: String(stats.lowStockItems), icon: AlertTriangle, color: 'red' as const },
    { label: 'Tarefas Ativas', value: String(stats.activeTasks), icon: ClipboardList, color: 'purple' as const },
    { label: 'Saldo Líquido', value: fmt(stats.revenue - stats.expense), icon: BarChart3, color: 'blue' as const },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bem-vindo, {user?.fullName?.split(' ')[0] ?? 'Admin'}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">Aqui está um resumo do seu negócio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={{ label: k.label, value: k.value }} icon={k.icon} color={k.color} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-800">Pedidos Recentes</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y">
            {stats.recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Nenhum pedido ainda.</p>
            ) : (
              (stats.recentOrders as Array<{ id: string; order_number: string; total_amount: number; status: string; created_at: string }>).map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.order_number}</p>
                    <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-slate-700">{fmt(Number(o.total_amount))}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-800">Entregas Recentes</h2>
            <Link href="/admin/deliveries" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y">
            {stats.recentDeliveries.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Nenhuma entrega ainda.</p>
            ) : (
              (stats.recentDeliveries as Array<{ id: string; status: string; created_at: string }>).map((d) => (
                <Link key={d.id} href={`/admin/deliveries/${d.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Entrega #{d.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Bot size={24} />
          <h2 className="font-semibold text-lg">Assistente IA</h2>
        </div>
        <p className="text-blue-100 text-sm mb-4">
          Use inteligência artificial para analisar dados, gerar insights e automatizar tarefas do seu negócio.
        </p>
        <Link
          href="/admin/ai"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors"
        >
          <Bot size={14} />
          Abrir Assistente IA
        </Link>
      </div>
    </div>
  );
}
