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

export default function NewBudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    allocated_amount: '',
    period_start: firstDay,
    period_end: lastDay,
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
        .from('finance_categories')
        .select('id, name, type')
        .eq('tenant_id', profile.tenant_id)
        .order('name');

      setCategories(data ?? []);
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(form.allocated_amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Valor alocado inválido');

      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from('budgets').insert({
        tenant_id: tenantId,
        name: form.name.trim(),
        category_id: form.category_id || null,
        allocated_amount: amount,
        spent_amount: 0,
        period_start: form.period_start,
        period_end: form.period_end,
      });

      if (insertError) throw insertError;

      router.push('/admin/budgets');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar orçamento');
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
        title="Novo Orçamento"
        description="Defina um orçamento por período e categoria"
        action={
          <Btn href="/admin/budgets" variant="secondary" icon={ArrowLeft}>
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
          <label htmlFor="name" className={labelClass}>Nome do Orçamento *</label>
          <input
            id="name" name="name" type="text" required
            value={form.name} onChange={handleChange}
            placeholder="Ex: Marketing Q1"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category_id" className={labelClass}>Categoria</label>
          <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
            <option value="">— Sem categoria —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Receita' : 'Despesa'})</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="allocated_amount" className={labelClass}>Valor Alocado (R$) *</label>
          <input
            id="allocated_amount" name="allocated_amount" type="number" step="0.01" min="0.01" required
            value={form.allocated_amount} onChange={handleChange}
            placeholder="0,00"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="period_start" className={labelClass}>Início do Período *</label>
            <input
              id="period_start" name="period_start" type="date" required
              value={form.period_start} onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="period_end" className={labelClass}>Fim do Período *</label>
            <input
              id="period_end" name="period_end" type="date" required
              value={form.period_end} onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn href="/admin/budgets" variant="secondary">Cancelar</Btn>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Orçamento'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
