import { KpiCard } from '@/components/kpi-card';
import { getAdminDashboardStats } from '@/services/dashboard';

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? '11111111-1111-1111-1111-111111111111';

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats(TENANT_ID).catch(() => ({
    totalSales: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    revenue: 0,
    expense: 0,
    lowStockItems: 0,
    activeTasks: 0
  }));

  const kpis = [
    { label: 'Total Sales', value: `$${stats.totalSales.toFixed(2)}` },
    { label: 'Total Orders', value: String(stats.totalOrders) },
    { label: 'Pending Deliveries', value: String(stats.pendingDeliveries) },
    { label: 'Revenue Summary', value: `$${stats.revenue.toFixed(2)}` },
    { label: 'Expense Summary', value: `$${stats.expense.toFixed(2)}` },
    { label: 'Low Stock Items', value: String(stats.lowStockItems) },
    { label: 'Active Tasks', value: String(stats.activeTasks) }
  ];

  return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}</section>;
}
