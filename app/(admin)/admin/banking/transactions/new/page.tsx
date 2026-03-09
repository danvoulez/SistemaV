'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const TX_TYPES = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'refund', label: 'Estorno' },
];

interface BankAccount {
  id: string;
  name: string;
  institution: string;
}

export default function NewBankTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    bank_account_id: '',
    type: 'income',
    amount: '',
    currency: 'BRL',
    description: '',
    occurred_at: today,
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile) return;

      setTenantId(profile.tenant_id);

      const { data } = await supabase
        .from('bank_accounts')
        .select('id, name, institution')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');

      setAccounts(data ?? []);
      if (data?.[0]) setForm((prev) => ({ ...prev, bank_account_id: data[0].id }));
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Valor inválido');

      const { error: txError } = await supabase.from('bank_transactions').insert({
        tenant_id: tenantId,
        bank_account_id: form.bank_account_id,
        type: form.type,
        amount,
        currency: form.currency || 'BRL',
        description: form.description.trim() || null,
        occurred_at: form.occurred_at,
        status: 'posted',
      });

      if (txError) throw txError;

      // Update account balance
      const sign = form.type === 'income' ? 1 : form.type === 'expense' ? -1 : 0;
      if (sign !== 0) {
        const { data: acct } = await supabase
          .from('bank_accounts').select('current_balance')
          .eq('id', form.bank_account_id).single();
        if (acct) {
          await supabase
            .from('bank_accounts')
            .update({ current_balance: Number(acct.current_balance) + sign * amount })
            .eq('id', form.bank_account_id);
        }
      }

      router.push('/admin/banking');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar transação');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader
        title="Nova Transação"
        description="Registre uma movimentação bancária"
        action={
          <Btn href="/admin/banking" variant="secondary" icon={ArrowLeft}>
            Cancelar
          </Btn>
        }
      />

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="bank_account_id" className={labelClass}>Conta *</label>
          <select
            id="bank_account_id" name="bank_account_id" required
            value={form.bank_account_id} onChange={handleChange}
            className={inputClass}
          >
            <option value="">— Selecione a conta —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.institution})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className={labelClass}>Tipo *</label>
            <select id="type" name="type" value={form.type} onChange={handleChange} className={inputClass}>
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className={labelClass}>Valor (R$) *</label>
            <input
              id="amount" name="amount" type="number" step="0.01" min="0.01" required
              value={form.amount} onChange={handleChange}
              placeholder="0,00"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="occurred_at" className={labelClass}>Data/Hora *</label>
          <input
            id="occurred_at" name="occurred_at" type="datetime-local" required
            value={form.occurred_at} onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Descrição</label>
          <textarea
            id="description" name="description" rows={2}
            value={form.description} onChange={handleChange}
            placeholder="Descrição opcional..."
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn href="/admin/banking" variant="secondary">Cancelar</Btn>
          <Btn type="submit" disabled={loading || !form.bank_account_id}>
            {loading ? 'Salvando...' : 'Registrar Transação'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
