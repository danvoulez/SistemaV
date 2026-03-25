'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn } from '@/components/btn';
import { Truck, CheckCircle, Calendar, RotateCcw } from 'lucide-react';

interface Props {
  deliveryId: string;
  currentStatus: string;
}

const STATUS_OPTIONS: Record<string, { next: string; label: string; icon: React.ElementType }[]> = {
  pending: [
    { next: 'scheduled', label: 'Agendar', icon: Calendar },
    { next: 'in_transit', label: 'Iniciar Trânsito', icon: Truck }
  ],
  scheduled: [{ next: 'in_transit', label: 'Iniciar Trânsito', icon: Truck }],
  in_transit: [
    { next: 'delivered', label: 'Confirmar Entrega', icon: CheckCircle },
    { next: 'failed', label: 'Registrar Falha', icon: RotateCcw }
  ]
};

export function DeliveryStatusForm({ deliveryId, currentStatus }: Props) {
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
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, description: note || undefined })
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? 'Erro ao atualizar status.');
      }
      setNote('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Atualizar Status</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="space-y-3">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Observação opcional" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <Btn key={opt.next} icon={opt.icon} onClick={() => handleUpdate(opt.next)} disabled={loading} variant={opt.next === 'failed' ? 'danger' : 'primary'}>
              {loading ? 'Atualizando...' : opt.label}
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
}
