import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Product } from '@/types/database';

export async function getProducts(tenantId: string, search?: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getProductById(id: string, tenantId: string): Promise<Product> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function createProduct(tenantId: string, data: Partial<Product>): Promise<Product> {
  const supabase = await createSupabaseServerClient();
  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...data, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return product;
}

export async function updateProduct(id: string, tenantId: string, data: Partial<Product>): Promise<Product> {
  const supabase = await createSupabaseServerClient();
  const { data: product, error } = await supabase
    .from('products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return product;
}

export async function deleteProduct(id: string, tenantId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw error;
}
