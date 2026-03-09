import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function getAdminDashboardStats(tenantId: string) {
  const supabase = createSupabaseServerClient();

  const [{ data: orders }, { data: deliveries }, { data: financeEntries }, { data: tasks }, { data: lowStock }] = await Promise.all([
    supabase.from('sales_orders').select('id,total_amount,status').eq('tenant_id', tenantId),
    supabase.from('deliveries').select('id,status').eq('tenant_id', tenantId),
    supabase.from('finance_entries').select('id,type,amount').eq('tenant_id', tenantId),
    supabase.from('tasks').select('id,status').eq('tenant_id', tenantId),
    supabase.from('inventory_balances').select('id,quantity_available').eq('tenant_id', tenantId).lte('quantity_available', 0)
  ]);

  const totalSales = (orders ?? []).reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
  const pendingDeliveries = (deliveries ?? []).filter((d) => d.status !== 'delivered').length;
  const revenue = (financeEntries ?? []).filter((e) => e.type === 'income').reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const expense = (financeEntries ?? []).filter((e) => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const activeTasks = (tasks ?? []).filter((t) => t.status !== 'done').length;

  return {
    totalSales,
    totalOrders: orders?.length ?? 0,
    pendingDeliveries,
    revenue,
    expense,
    activeTasks,
    lowStockItems: (lowStock ?? []).length
  };
}
