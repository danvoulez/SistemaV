import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { FinanceEntry, FinanceCategory, Budget } from '@/types/database';

export async function getFinanceEntries(
  tenantId: string,
  type?: string,
  limit = 50
): Promise<FinanceEntry[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('finance_entries')
    .select('*, category:finance_categories!category_id(id,name,type)')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FinanceEntry[];
}

export async function createFinanceEntry(
  tenantId: string,
  data: {
    categoryId?: string;
    type: string;
    amount: number;
    currency?: string;
    description?: string;
    occurredAt?: string;
    referenceType?: string;
    referenceId?: string;
    createdBy?: string;
  }
): Promise<FinanceEntry> {
  const supabase = await createSupabaseServerClient();
  const { data: entry, error } = await supabase
    .from('finance_entries')
    .insert({
      tenant_id: tenantId,
      category_id: data.categoryId,
      type: data.type,
      amount: data.amount,
      currency: data.currency ?? 'BRL',
      description: data.description,
      occurred_at: data.occurredAt ?? new Date().toISOString(),
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      created_by: data.createdBy
    })
    .select()
    .single();
  if (error) throw error;
  return entry as FinanceEntry;
}

export async function getFinanceCategories(tenantId: string): Promise<FinanceCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('finance_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createFinanceCategory(
  tenantId: string,
  name: string,
  type: 'income' | 'expense'
): Promise<FinanceCategory> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('finance_categories')
    .insert({ tenant_id: tenantId, name, type })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBudgets(tenantId: string): Promise<Budget[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:finance_categories!category_id(id,name,type)')
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Budget[];
}

export async function createBudget(
  tenantId: string,
  data: {
    name: string;
    categoryId?: string;
    allocatedAmount: number;
    periodStart: string;
    periodEnd: string;
  }
): Promise<Budget> {
  const supabase = await createSupabaseServerClient();
  const { data: budget, error } = await supabase
    .from('budgets')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      category_id: data.categoryId,
      allocated_amount: data.allocatedAmount,
      spent_amount: 0,
      period_start: data.periodStart,
      period_end: data.periodEnd
    })
    .select()
    .single();
  if (error) throw error;
  return budget as Budget;
}

export async function getFinanceSummary(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data } = await supabase
    .from('finance_entries')
    .select('type, amount')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', startOfMonth);

  const entries = data ?? [];
  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  return { income, expense, net: income - expense };
}
