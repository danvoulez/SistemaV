import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { InventoryLocation, InventoryMovement, InventoryBalance } from '@/types/database';

export async function getInventoryLocations(tenantId: string): Promise<InventoryLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_locations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createLocation(
  tenantId: string,
  name: string,
  type: string
): Promise<InventoryLocation> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_locations')
    .insert({ tenant_id: tenantId, name, type, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInventoryBalances(tenantId: string): Promise<InventoryBalance[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      *,
      merchandise:merchandise!merchandise_id(id,sku,unit,sale_price,object:objects!object_id(title)),
      location:inventory_locations!location_id(id,name,type)
    `)
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InventoryBalance[];
}

export async function getLowStockItems(tenantId: string): Promise<InventoryBalance[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      *,
      merchandise:merchandise!merchandise_id(id,sku,min_stock,object:objects!object_id(title)),
      location:inventory_locations!location_id(id,name)
    `)
    .eq('tenant_id', tenantId)
    .lte('quantity_available', 0);
  if (error) throw error;
  return (data ?? []) as InventoryBalance[];
}

export async function getInventoryMovements(tenantId: string, limit = 50): Promise<InventoryMovement[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      location:inventory_locations!location_id(id,name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as InventoryMovement[];
}

export async function recordInventoryMovement(
  tenantId: string,
  data: {
    merchandiseId: string;
    locationId: string;
    movementType: string;
    quantity: number;
    unitCost?: number;
    referenceType?: string;
    referenceId?: string;
    createdBy?: string;
  }
): Promise<InventoryMovement> {
  const supabase = await createSupabaseServerClient();
  const { data: movement, error } = await supabase
    .from('inventory_movements')
    .insert({
      tenant_id: tenantId,
      merchandise_id: data.merchandiseId,
      location_id: data.locationId,
      movement_type: data.movementType,
      quantity: data.quantity,
      unit_cost: data.unitCost,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      created_by: data.createdBy
    })
    .select()
    .single();
  if (error) throw error;

  // Recalculate balance
  const { data: existing } = await supabase
    .from('inventory_balances')
    .select('id, quantity_on_hand, quantity_reserved')
    .eq('tenant_id', tenantId)
    .eq('merchandise_id', data.merchandiseId)
    .eq('location_id', data.locationId)
    .single();

  const delta = ['in', 'release'].includes(data.movementType)
    ? data.quantity
    : ['out', 'reservation'].includes(data.movementType)
    ? -data.quantity
    : 0;

  const on_hand = (existing?.quantity_on_hand ?? 0) + delta;
  const reserved = existing?.quantity_reserved ?? 0;

  if (existing) {
    await supabase
      .from('inventory_balances')
      .update({
        quantity_on_hand: on_hand,
        quantity_available: on_hand - reserved,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('inventory_balances').insert({
      tenant_id: tenantId,
      merchandise_id: data.merchandiseId,
      location_id: data.locationId,
      quantity_on_hand: on_hand,
      quantity_reserved: reserved,
      quantity_available: on_hand - reserved
    });
  }

  return movement as InventoryMovement;
}


export async function getMerchandiseOptions(tenantId: string): Promise<Array<{ id: string; label: string; sku: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('merchandise')
    .select('id, sku, object:objects!object_id(title)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    sku: m.sku,
    label: (m.object as { title?: string } | null)?.title ?? m.sku
  }));
}
