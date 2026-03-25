'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  taskId: string;
  currentStatus: string;
}

const NEXT_STATUS: Record<string, string> = {
  todo: 'Iniciar',
  in_progress: 'Concluir',
  blocked: 'Retomar',
  done: 'Reabrir'
};

export function TaskStatusButton({ taskId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const label = NEXT_STATUS[currentStatus];
  if (!label) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch(`/api/tasks/${taskId}/status`, { method: 'PATCH' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handleClick} disabled={loading} className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors">{loading ? 'Atualizando...' : label}</button>;
}
