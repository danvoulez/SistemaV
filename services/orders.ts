import { supabase } from '@/lib/supabase';

export async function fetchOrdersByTenant(tenantId: string) {
  return supabase.from('sales_orders').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
}
