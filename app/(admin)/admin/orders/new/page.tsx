'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

interface Person {
  id: string;
  full_name: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { product_id: '', product_name: '', sku: '', unit_price: 0, quantity: 1 },
  ]);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;
      setTenantId(profile.tenant_id);

      const [{ data: peopleData }, { data: productsData }] = await Promise.all([
        supabase
          .from('people')
          .select('id, full_name, email')
          .eq('tenant_id', profile.tenant_id)
          .order('full_name'),
        supabase
          .from('products')
          .select('id, name, sku, price')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true)
          .order('name'),
      ]);

      setPeople(peopleData ?? []);
      setProducts(productsData ?? []);
    };
    load();
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', product_name: '', sku: '', unit_price: 0, quantity: 1 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'product_id') {
          const product = products.find((p) => p.id === value);
          return {
            ...item,
            product_id: value as string,
            product_name: product?.name ?? '',
            sku: product?.sku ?? '',
            unit_price: Number(product?.price ?? 0),
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Selecione um cliente');
      return;
    }
    if (items.some((i) => !i.product_id)) {
      setError('Selecione um produto para cada item');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const orderNumber = `ORD-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          tenant_id: tenantId,
          customer_person_id: customerId,
          order_number: orderNumber,
          status: 'draft',
          payment_status: 'pending',
          subtotal_amount: subtotal,
          discount_amount: 0,
          delivery_amount: 0,
          total_amount: subtotal,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const lineItems = items.map((item) => ({
        tenant_id: tenantId,
        order_id: order.id,
        product_id: item.product_id || null,
        product_name_snapshot: item.product_name,
        sku_snapshot: item.sku || null,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        discount_amount: 0,
        line_total: Number(item.unit_price) * Number(item.quantity),
      }));

      const { error: itemsError } = await supabase.from('sales_order_items').insert(lineItems);
      if (itemsError) throw itemsError;

      router.push(`/admin/orders/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Novo Pedido"
        description="Crie um pedido de venda"
        action={
          <Btn href="/admin/orders" variant="secondary" icon={ArrowLeft}>
            Cancelar
          </Btn>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Customer */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Cliente</h2>
          <div>
            <label htmlFor="customer_id" className={labelClass}>Selecione o cliente *</label>
            <select
              id="customer_id"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">— Selecione —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} {p.email ? `(${p.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Itens do Pedido</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus size={14} />
              Adicionar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  {index === 0 && <label className={labelClass}>Produto</label>}
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">— Selecione —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  {index === 0 && <label className={labelClass}>Preço Unit. (R$)</label>}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className={labelClass}>Qtd</label>}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {index === 0 && <div className="mb-1 h-5" />}
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    {brl(Number(item.unit_price) * Number(item.quantity))}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t pt-3">
            <div className="text-sm font-semibold text-slate-900">
              Total: <span className="text-emerald-700">{brl(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <label htmlFor="notes" className={labelClass}>Observações</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais sobre o pedido..."
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Btn href="/admin/orders" variant="secondary">
            Cancelar
          </Btn>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Pedido'}
          </Btn>
        </div>
      </form>
    </div>
  );
}
