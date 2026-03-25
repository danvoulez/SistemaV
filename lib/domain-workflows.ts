export const ORDER_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'packed', 'cancelled'],
  paid: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered']
};

export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  pending: ['scheduled', 'in_transit'],
  scheduled: ['in_transit'],
  in_transit: ['delivered', 'failed', 'returned'],
  failed: ['in_transit', 'returned'],
  returned: [],
  delivered: []
};

export function canTransition(current: string, next: string, transitions: Record<string, string[]>): boolean {
  return (transitions[current] ?? []).includes(next);
}
