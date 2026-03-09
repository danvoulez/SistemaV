import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { SalesOrder } from '@/types/database';

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'packed', 'cancelled'],
  paid: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered'],
};

export async function getOrders(tenantId: string, status?: string): Promise<SalesOrder[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('sales_orders')
    .select('*, customer:people!customer_person_id(id,full_name,email,phone)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SalesOrder[];
}

export async function getOrderById(id: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:people!customer_person_id(id,full_name,email,phone),
      items:sales_order_items(*),
      deliveries(id,status,delivery_type,scheduled_for)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrderDraft(
  tenantId: string,
  customerId: string,
  items: Array<{ productId?: string; productName: string; sku?: string; unitPrice: number; quantity: number; discount?: number }>,
  sellerProfileId?: string,
  notes?: string
) {
  const supabase = await createSupabaseServerClient();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity - (i.discount ?? 0), 0);
  const orderNumber = `ORD-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      tenant_id: tenantId,
      customer_person_id: customerId,
      seller_profile_id: sellerProfileId,
      order_number: orderNumber,
      status: 'draft',
      subtotal_amount: subtotal,
      discount_amount: 0,
      delivery_amount: 0,
      total_amount: subtotal,
      payment_status: 'pending',
      notes
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const lineItems = items.map((i) => ({
    tenant_id: tenantId,
    order_id: order.id,
    product_id: i.productId,
    product_name_snapshot: i.productName,
    sku_snapshot: i.sku,
    unit_price: i.unitPrice,
    quantity: i.quantity,
    discount_amount: i.discount ?? 0,
    line_total: i.unitPrice * i.quantity - (i.discount ?? 0)
  }));

  const { error: itemsError } = await supabase.from('sales_order_items').insert(lineItems);
  if (itemsError) throw itemsError;

  return order;
}

export async function confirmOrder(id: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('status', 'draft')
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, tenantId: string, status: string) {
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from('sales_orders')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!order) throw new Error('Order not found');

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`);
  }

  const { data, error } = await supabase
    .from('sales_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelOrder(id: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaymentStatus(
  id: string,
  tenantId: string,
  paymentStatus: string,
  paymentMethod?: string
) {
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  };
  if (paymentMethod) updates.payment_method = paymentMethod;
  if (paymentStatus === 'paid') updates.status = 'paid';

  const { data, error } = await supabase
    .from('sales_orders')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
