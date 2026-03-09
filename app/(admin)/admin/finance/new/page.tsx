'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

interface FinanceCategory {
  id: string;
  name: string;
  type: string;
}

export default function NewFinanceEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    currency: 'BRL',
    description: '',
    occurred_at: today,
    category_id: '',
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile) return;

      setTenantId(profile.tenant_id);

      const { data } = await supabase
        .from('finance_categories')
        .select('id, name, type')
        .eq('tenant_id', profile.tenant_id)
        .order('name');

      setCategories(data ?? []);
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
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Valor inválido');

      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from('finance_entries').insert({
        tenant_id: tenantId,
        type: form.type,
        amount,
        currency: form.currency || 'BRL',
        description: form.description.trim() || null,
        occurred_at: form.occurred_at,
        category_id: form.category_id || null,
        created_by: userId,
      });

      if (insertError) throw insertError;

      router.push('/admin/finance');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader
        title="Novo Lançamento"
        description="Registre uma entrada ou saída financeira"
        action={
          <Btn href="/admin/finance" variant="secondary" icon={ArrowLeft}>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className={labelClass}>Tipo *</label>
            <select
              id="type" name="type" value={form.type} onChange={handleChange}
              className={inputClass}
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
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
          <label htmlFor="category_id" className={labelClass}>Categoria</label>
          <select
            id="category_id" name="category_id" value={form.category_id} onChange={handleChange}
            className={inputClass}
          >
            <option value="">— Sem categoria —</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
          <Btn href="/admin/finance" variant="secondary">Cancelar</Btn>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Lançamento'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
