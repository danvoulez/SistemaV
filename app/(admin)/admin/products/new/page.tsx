'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    sale_price: '',
    cost_price: '',
    category: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) throw new Error('Perfil não encontrado');

      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          tenant_id: profile.tenant_id,
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          barcode: form.barcode.trim() || null,
          description: form.description.trim() || null,
          sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
          cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
          category: form.category.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/admin/products/${product.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Novo Produto"
        description="Preencha os dados do produto"
        action={
          <Btn href="/admin/products" variant="secondary" icon={ArrowLeft}>
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
          <label htmlFor="name" className={labelClass}>Nome *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Ex: Camiseta Básica"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sku" className={labelClass}>SKU</label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={form.sku}
              onChange={handleChange}
              placeholder="Ex: CAM-001"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="barcode" className={labelClass}>Código de Barras</label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={form.barcode}
              onChange={handleChange}
              placeholder="Ex: 7891234567890"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>Categoria</label>
          <input
            id="category"
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            placeholder="Ex: Roupas"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sale_price" className={labelClass}>Preço de Venda (R$)</label>
            <input
              id="sale_price"
              name="sale_price"
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price}
              onChange={handleChange}
              placeholder="0,00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cost_price" className={labelClass}>Preço de Custo (R$)</label>
            <input
              id="cost_price"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={handleChange}
              placeholder="0,00"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Descrição</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Descreva o produto..."
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn href="/admin/products" variant="secondary">
            Cancelar
          </Btn>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Produto'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
