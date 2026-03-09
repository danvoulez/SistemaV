'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Props {
  taskId: string;
  currentStatus: string;
}

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  todo: { next: 'in_progress', label: 'Iniciar' },
  in_progress: { next: 'done', label: 'Concluir' },
  blocked: { next: 'in_progress', label: 'Retomar' },
  done: { next: 'todo', label: 'Reabrir' },
};

export function TaskStatusButton({ taskId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const transition = NEXT_STATUS[currentStatus];
  if (!transition) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from('tasks')
        .update({ status: transition.next, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Atualizando...' : transition.label}
    </button>
  );
}
