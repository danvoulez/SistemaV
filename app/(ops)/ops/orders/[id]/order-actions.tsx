'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn } from '@/components/btn';
import { CheckCircle, Package, Truck } from 'lucide-react';

interface Props {
  orderId: string;
  currentStatus: string;
}

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; icon: React.ElementType }[]> = {
  confirmed: [{ next: 'packed', label: 'Marcar como Embalado', icon: Package }],
  paid: [{ next: 'packed', label: 'Marcar como Embalado', icon: Package }],
  packed: [{ next: 'shipped', label: 'Marcar como Enviado', icon: Truck }],
  shipped: [{ next: 'delivered', label: 'Marcar como Entregue', icon: CheckCircle }]
};

export function OpsOrderActions({ orderId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return null;

  const handleUpdate = async (nextStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? 'Erro ao atualizar status.');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-700 mb-4">Ações</h2>{error && <p className="text-sm text-red-600 mb-3">{error}</p>}<div className="flex flex-wrap gap-3">{transitions.map((t) => <Btn key={t.next} icon={t.icon} onClick={() => handleUpdate(t.next)} disabled={loading}>{loading ? 'Atualizando...' : t.label}</Btn>)}</div></div>;
}
