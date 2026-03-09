import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VALID_TRANSITIONS } from '@/services/orders';

// ─── State machine unit tests (no DB needed) ───────────────────────────────

describe('VALID_TRANSITIONS', () => {
  it('allows draft → confirmed', () => {
    expect(VALID_TRANSITIONS['draft']).toContain('confirmed');
  });

  it('allows draft → cancelled', () => {
    expect(VALID_TRANSITIONS['draft']).toContain('cancelled');
  });

  it('allows confirmed → paid', () => {
    expect(VALID_TRANSITIONS['confirmed']).toContain('paid');
  });

  it('allows confirmed → packed', () => {
    expect(VALID_TRANSITIONS['confirmed']).toContain('packed');
  });

  it('allows confirmed → cancelled', () => {
    expect(VALID_TRANSITIONS['confirmed']).toContain('cancelled');
  });

  it('allows packed → shipped', () => {
    expect(VALID_TRANSITIONS['packed']).toContain('shipped');
  });

  it('allows shipped → delivered', () => {
    expect(VALID_TRANSITIONS['shipped']).toContain('delivered');
  });

  it('does NOT allow draft → shipped (skipping steps)', () => {
    expect(VALID_TRANSITIONS['draft']).not.toContain('shipped');
  });

  it('does NOT allow delivered → any further status', () => {
    expect(VALID_TRANSITIONS['delivered']).toBeUndefined();
  });

  it('does NOT allow cancelled → any status', () => {
    expect(VALID_TRANSITIONS['cancelled']).toBeUndefined();
  });

  it('does NOT allow packed → confirmed (going backwards)', () => {
    expect(VALID_TRANSITIONS['packed']).not.toContain('confirmed');
  });
});

// ─── updateOrderStatus integration tests (mocked Supabase) ─────────────────

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { updateOrderStatus, confirmOrder } from '@/services/orders';

function makeSupabaseMock(order: { status: string } | null, updateResult?: object) {
  const single = vi.fn();
  const selectMock = vi.fn().mockReturnValue({ single });
  const eqMock = vi.fn().mockReturnThis();

  // First chain: select order
  single.mockResolvedValueOnce({ data: order, error: null });

  // Second chain: update order
  const updateSingle = vi.fn().mockResolvedValueOnce({
    data: updateResult ?? { ...order, status: 'updated' },
    error: null,
  });
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle, eq: eqMock });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock, select: updateSelect });

  const from = vi.fn().mockReturnValue({
    select: selectMock,
    update: updateMock,
    eq: eqMock,
  });

  // Build chainable mock
  selectMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue({ eq: eqMock, single, select: updateSelect });

  return { from, selectMock, updateMock, single, updateSingle };
}

describe('updateOrderStatus', () => {
  it('throws when order is not found', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(updateOrderStatus('fake-id', 'tenant-id', 'confirmed')).rejects.toThrow('Order not found');
  });

  it('throws on invalid transition', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { status: 'delivered' }, error: null }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(updateOrderStatus('id', 'tid', 'confirmed')).rejects.toThrow(
      'Cannot transition from delivered to confirmed'
    );
  });
});

describe('confirmOrder', () => {
  it('throws when supabase returns an error', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Row not found' },
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(confirmOrder('id', 'tid')).rejects.toMatchObject({ message: 'Row not found' });
  });
});
