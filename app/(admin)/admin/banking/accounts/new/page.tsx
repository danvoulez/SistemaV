'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'investment', label: 'Investimento' },
  { value: 'cash', label: 'Caixa' },
];

export default function NewBankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    institution: '',
    account_type: 'checking',
    currency: 'BRL',
    current_balance: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { error: insertError } = await supabase.from('bank_accounts').insert({
        tenant_id: profile.tenant_id,
        name: form.name.trim(),
        institution: form.institution.trim(),
        account_type: form.account_type,
        currency: form.currency.trim() || 'BRL',
        current_balance: parseFloat(form.current_balance) || 0,
        is_active: true,
      });

      if (insertError) throw insertError;

      router.push('/admin/banking');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
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
        title="Nova Conta Bancária"
        description="Cadastre uma conta bancária ou caixa"
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
          <label htmlFor="name" className={labelClass}>Nome da Conta *</label>
          <input
            id="name" name="name" type="text" required
            value={form.name} onChange={handleChange}
            placeholder="Ex: Conta Principal"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="institution" className={labelClass}>Instituição *</label>
          <input
            id="institution" name="institution" type="text" required
            value={form.institution} onChange={handleChange}
            placeholder="Ex: Banco do Brasil"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="account_type" className={labelClass}>Tipo</label>
            <select id="account_type" name="account_type" value={form.account_type} onChange={handleChange} className={inputClass}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currency" className={labelClass}>Moeda</label>
            <input
              id="currency" name="currency" type="text"
              value={form.currency} onChange={handleChange}
              placeholder="BRL"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="current_balance" className={labelClass}>Saldo Inicial (R$)</label>
          <input
            id="current_balance" name="current_balance" type="number" step="0.01"
            value={form.current_balance} onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn href="/admin/banking" variant="secondary">Cancelar</Btn>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Conta'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
