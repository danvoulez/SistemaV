'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Btn } from '@/components/btn';
import { PlusCircle } from 'lucide-react';
import type { PostgrestError } from '@supabase/supabase-js';

interface Location {
  id: string;
  name: string;
  type: string;
}

interface Props {
  locations: Location[];
  userId: string;
}

const MOVEMENT_TYPES = [
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Saída' },
  { value: 'reservation', label: 'Reserva' },
  { value: 'release', label: 'Liberação' },
];

export function InventoryMovementForm({ locations, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [merchandiseId, setMerchandiseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [movementType, setMovementType] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchandiseId || !locationId || !quantity) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id ?? '')
        .single();

      const { error: moveErr } = await supabase.from('inventory_movements').insert({
        tenant_id: profile?.tenant_id,
        merchandise_id: merchandiseId,
        location_id: locationId,
        movement_type: movementType,
        quantity: parseFloat(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : null,
        created_by: userId,
      });

      if (moveErr) throw moveErr;

      setSuccess(true);
      setMerchandiseId('');
      setLocationId('');
      setMovementType('in');
      setQuantity('');
      setUnitCost('');
      router.refresh();
    } catch (error: unknown) {
      const message = (error as PostgrestError)?.message;
      setError(message ?? 'Erro ao registrar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Registrar Movimentação</h2>
        <Btn variant="secondary" size="sm" icon={PlusCircle} onClick={() => setOpen(!open)}>
          {open ? 'Fechar' : 'Nova Movimentação'}
        </Btn>
      </div>

      {open && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">ID da Mercadoria *</label>
              <input
                type="text"
                value={merchandiseId}
                onChange={(e) => setMerchandiseId(e.target.value)}
                required
                placeholder="UUID da mercadoria"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Localização *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar localização...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo de Movimentação *</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MOVEMENT_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>{mt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Quantidade *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0.001"
                step="any"
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Custo Unitário (opcional)</label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                min="0"
                step="0.01"
                placeholder="R$ 0,00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Btn type="submit" disabled={loading} className="w-full justify-center">
                {loading ? 'Registrando...' : 'Registrar'}
              </Btn>
            </div>
          </form>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {success && <p className="text-sm text-emerald-600 mt-3">Movimentação registrada com sucesso!</p>}
        </div>
      )}
    </section>
  );
}
