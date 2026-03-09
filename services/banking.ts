import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { BankAccount, BankTransaction } from '@/types/database';

export async function getBankAccounts(tenantId: string): Promise<BankAccount[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getBankAccountById(id: string, tenantId: string): Promise<BankAccount> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function createBankAccount(tenantId: string, data: Partial<BankAccount>): Promise<BankAccount> {
  const supabase = await createSupabaseServerClient();
  const { data: account, error } = await supabase
    .from('bank_accounts')
    .insert({ ...data, tenant_id: tenantId })
    .select()
    .single();
  if (error) throw error;
  return account;
}

export async function getTransactions(
  tenantId: string,
  accountId?: string,
  limit = 50
): Promise<BankTransaction[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('bank_transactions')
    .select('*, account:bank_accounts!bank_account_id(id,name,institution)')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (accountId) query = query.eq('bank_account_id', accountId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BankTransaction[];
}

export async function createTransaction(
  tenantId: string,
  data: {
    bankAccountId: string;
    type: string;
    amount: number;
    currency?: string;
    description?: string;
    occurredAt?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<BankTransaction> {
  const supabase = await createSupabaseServerClient();
  const { data: txn, error } = await supabase
    .from('bank_transactions')
    .insert({
      tenant_id: tenantId,
      bank_account_id: data.bankAccountId,
      type: data.type,
      amount: data.amount,
      currency: data.currency ?? 'BRL',
      description: data.description,
      occurred_at: data.occurredAt ?? new Date().toISOString(),
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      status: 'confirmed'
    })
    .select()
    .single();
  if (error) throw error;

  // Update account balance manually
  const sign = data.type === 'income' ? 1 : -1;
  const { data: acct } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('id', data.bankAccountId)
    .single();
  if (acct) {
    await supabase
      .from('bank_accounts')
      .update({ current_balance: Number(acct.current_balance) + sign * data.amount })
      .eq('id', data.bankAccountId);
  }

  return txn as BankTransaction;
}
