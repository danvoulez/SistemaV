import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Delivery, DeliveryEvent } from '@/types/database';

export async function getDeliveries(tenantId: string, status?: string): Promise<Delivery[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('deliveries')
    .select(`
      *,
      order:sales_orders!order_id(id,order_number,total_amount),
      recipient:people!recipient_person_id(id,full_name,phone)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Delivery[];
}

export async function getDeliveryById(id: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      order:sales_orders!order_id(id,order_number,total_amount,customer_person_id),
      recipient:people!recipient_person_id(id,full_name,phone,email),
      events:delivery_events(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function createDelivery(
  tenantId: string,
  orderId: string,
  data: {
    recipientPersonId?: string;
    addressId?: string;
    deliveryType: string;
    scheduledFor?: string;
    notes?: string;
  }
) {
  const supabase = await createSupabaseServerClient();
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      recipient_person_id: data.recipientPersonId,
      address_id: data.addressId,
      delivery_type: data.deliveryType,
      status: 'pending',
      scheduled_for: data.scheduledFor,
      notes: data.notes
    })
    .select()
    .single();
  if (error) throw error;

  // Create initial event
  await supabase.from('delivery_events').insert({
    tenant_id: tenantId,
    delivery_id: delivery.id,
    event_type: 'created',
    description: 'Entrega criada'
  });

  return delivery;
}

export async function updateDeliveryStatus(
  id: string,
  tenantId: string,
  status: string,
  description?: string,
  createdBy?: string
) {
  const supabase = await createSupabaseServerClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };
  if (status === 'in_transit') updates.dispatched_at = new Date().toISOString();
  if (status === 'delivered') updates.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deliveries')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('delivery_events').insert({
    tenant_id: tenantId,
    delivery_id: id,
    event_type: status,
    description: description ?? `Status atualizado para ${status}`,
    created_by: createdBy
  });

  return data;
}

export async function getDeliveryEvents(deliveryId: string, tenantId: string): Promise<DeliveryEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('delivery_events')
    .select('*')
    .eq('delivery_id', deliveryId)
    .eq('tenant_id', tenantId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}
