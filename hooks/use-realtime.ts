'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
  onDelete?: (payload: unknown) => void;
}

export function useRealtime({
  table,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channelName = `realtime:${schema}:${table}:${filter ?? 'all'}`;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: '*',
          schema,
          table,
          ...(filter ? { filter } : {})
        },
        (payload: { eventType: string; new: unknown; old: unknown }) => {
          if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
          if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
          if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [table, schema, filter, onInsert, onUpdate, onDelete]);
}

// Hook for real-time order updates
export function useOrderUpdates(tenantId: string, onUpdate: (order: unknown) => void) {
  const memoizedOnUpdate = useCallback(onUpdate, [onUpdate]);
  useRealtime({
    table: 'sales_orders',
    filter: `tenant_id=eq.${tenantId}`,
    onUpdate: memoizedOnUpdate,
    onInsert: memoizedOnUpdate
  });
}

// Hook for real-time delivery updates
export function useDeliveryUpdates(tenantId: string, onUpdate: (delivery: unknown) => void) {
  const memoizedOnUpdate = useCallback(onUpdate, [onUpdate]);
  useRealtime({
    table: 'deliveries',
    filter: `tenant_id=eq.${tenantId}`,
    onUpdate: memoizedOnUpdate,
    onInsert: memoizedOnUpdate
  });
}

// Hook for real-time task updates
export function useTaskUpdates(tenantId: string, onUpdate: (task: unknown) => void) {
  const memoizedOnUpdate = useCallback(onUpdate, [onUpdate]);
  useRealtime({
    table: 'tasks',
    filter: `tenant_id=eq.${tenantId}`,
    onUpdate: memoizedOnUpdate,
    onInsert: memoizedOnUpdate,
    onDelete: memoizedOnUpdate
  });
}
