'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn } from '@/components/btn';
import { PlusCircle } from 'lucide-react';

interface Location { id: string; name: string; }
interface MerchandiseOption { id: string; label: string; sku: string; }
interface Props { locations: Location[]; merchandise: MerchandiseOption[]; }

export function InventoryMovementForm({ locations, merchandise }: Props) {
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
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchandiseId, locationId, movementType, quantity: Number(quantity), unitCost: unitCost ? Number(unitCost) : undefined })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Erro ao registrar movimentação.');
      setSuccess(true); setMerchandiseId(''); setLocationId(''); setQuantity(''); setUnitCost(''); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao registrar movimentação.'); }
    setLoading(false);
  };

  return <section><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-700">Registrar Movimentação</h2><Btn variant="secondary" size="sm" icon={PlusCircle} onClick={() => setOpen(!open)}>{open ? 'Fechar' : 'Nova Movimentação'}</Btn></div>
    {open && <div className="rounded-xl border bg-white p-5 shadow-sm"><form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><label className="text-xs font-medium">Mercadoria *</label><select value={merchandiseId} onChange={(e) => setMerchandiseId(e.target.value)} required className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">Selecionar...</option>{merchandise.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.sku})</option>)}</select></div>
    <div><label className="text-xs font-medium">Localização *</label><select value={locationId} onChange={(e) => setLocationId(e.target.value)} required className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">Selecionar...</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
    <div><label className="text-xs font-medium">Tipo *</label><select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="in">Entrada</option><option value="out">Saída</option><option value="reservation">Reserva</option><option value="release">Liberação</option></select></div>
    <div><label className="text-xs font-medium">Quantidade *</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.001" step="0.001" className="w-full rounded-lg border px-3 py-2 text-sm" /></div>
    <div><label className="text-xs font-medium">Custo Unitário</label><input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} min="0" step="0.01" className="w-full rounded-lg border px-3 py-2 text-sm" /></div>
    <div className="flex items-end"><Btn type="submit" disabled={loading} className="w-full justify-center">{loading ? 'Registrando...' : 'Registrar'}</Btn></div></form>{error && <p className="text-sm text-red-600 mt-3">{error}</p>}{success && <p className="text-sm text-emerald-600 mt-3">Movimentação registrada com sucesso!</p>}</div>}</section>;
}
