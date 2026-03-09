'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Btn } from '@/components/btn';
import { Truck, CheckCircle, Calendar, RotateCcw } from 'lucide-react';

interface Props {
  deliveryId: string;
  currentStatus: string;
  userId: string;
}

const STATUS_OPTIONS: Record<string, { next: string; label: string; icon: React.ElementType }[]> = {
  pending: [
    { next: 'scheduled', label: 'Agendar', icon: Calendar },
    { next: 'in_transit', label: 'Iniciar Trânsito', icon: Truck },
  ],
  scheduled: [
    { next: 'in_transit', label: 'Iniciar Trânsito', icon: Truck },
  ],
  in_transit: [
    { next: 'delivered', label: 'Confirmar Entrega', icon: CheckCircle },
    { next: 'failed', label: 'Registrar Falha', icon: RotateCcw },
  ],
};

export function DeliveryStatusForm({ deliveryId, currentStatus, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const router = useRouter();

  const options = STATUS_OPTIONS[currentStatus] ?? [];
  if (options.length === 0) return null;

  const handleUpdate = async (nextStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();

      const updates: Record<string, unknown> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      if (nextStatus === 'in_transit') updates.dispatched_at = new Date().toISOString();
      if (nextStatus === 'delivered') updates.delivered_at = new Date().toISOString();

      const { error: updateErr } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId);
      if (updateErr) throw updateErr;

      await supabase.from('delivery_events').insert({
        delivery_id: deliveryId,
        event_type: nextStatus,
        description: note || `Status atualizado para ${nextStatus}`,
        created_by: userId,
      });

      setNote('');
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Atualizar Status</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            Observação (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Adicione uma observação sobre a atualização..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <Btn
              key={opt.next}
              icon={opt.icon}
              onClick={() => handleUpdate(opt.next)}
              disabled={loading}
              variant={opt.next === 'failed' ? 'danger' : 'primary'}
            >
              {loading ? 'Atualizando...' : opt.label}
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
}
