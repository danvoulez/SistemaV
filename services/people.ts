import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Person, Address } from '@/types/database';

export async function getPeople(tenantId: string, search?: string): Promise<Person[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('people')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('full_name');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPersonById(id: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('people')
    .select('*, addresses(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function createPerson(tenantId: string, data: Partial<Person>): Promise<Person> {
  const supabase = await createSupabaseServerClient();
  const { data: person, error } = await supabase
    .from('people')
    .insert({ ...data, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return person;
}

export async function updatePerson(id: string, tenantId: string, data: Partial<Person>): Promise<Person> {
  const supabase = await createSupabaseServerClient();
  const { data: person, error } = await supabase
    .from('people')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return person;
}

export async function deletePerson(id: string, tenantId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('people')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw error;
}

export async function getAddressesByPerson(personId: string, tenantId: string): Promise<Address[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('person_id', personId)
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
