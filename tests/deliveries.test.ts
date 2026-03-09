import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { updateDeliveryStatus } from '@/services/deliveries';

function mockChain(result: object) {
  const eqFn: ReturnType<typeof vi.fn> = vi.fn();
  const singleFn = vi.fn().mockResolvedValue(result);
  eqFn.mockReturnValue({ eq: eqFn, select: vi.fn().mockReturnValue({ single: singleFn }) });

  const insertFn = vi.fn().mockResolvedValue({ error: null });

  return { eqFn, singleFn, insertFn };
}

describe('updateDeliveryStatus', () => {
  it('sets dispatched_at when status is in_transit', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const eqFn = vi.fn().mockReturnThis();
    const singleFn = vi.fn().mockResolvedValue({ data: { id: 'd1', status: 'in_transit' }, error: null });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'deliveries') {
          return {
            update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
              capturedUpdate = data;
              return { eq: eqFn };
            }),
            eq: eqFn,
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as never);

    eqFn.mockReturnValue({
      eq: eqFn,
      select: vi.fn().mockReturnValue({ single: singleFn }),
    });

    await updateDeliveryStatus('d1', 'tid', 'in_transit');

    expect(capturedUpdate).toHaveProperty('dispatched_at');
    expect(capturedUpdate).not.toHaveProperty('delivered_at');
  });

  it('sets delivered_at when status is delivered', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const eqFn = vi.fn().mockReturnThis();
    const singleFn = vi.fn().mockResolvedValue({ data: { id: 'd1', status: 'delivered' }, error: null });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'deliveries') {
          return {
            update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
              capturedUpdate = data;
              return { eq: eqFn };
            }),
            eq: eqFn,
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
    } as never);

    eqFn.mockReturnValue({
      eq: eqFn,
      select: vi.fn().mockReturnValue({ single: singleFn }),
    });

    await updateDeliveryStatus('d1', 'tid', 'delivered');

    expect(capturedUpdate).toHaveProperty('delivered_at');
  });

  it('throws when supabase returns an error', async () => {
    const eqFn = vi.fn().mockReturnThis();
    eqFn.mockReturnValue({
      eq: eqFn,
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqFn }),
        eq: eqFn,
      }),
    } as never);

    await expect(updateDeliveryStatus('d1', 'tid', 'in_transit')).rejects.toMatchObject({
      message: 'Not found',
    });
  });
});
