import { describe, it, expect } from 'vitest';
import { canTransition, ORDER_TRANSITIONS, DELIVERY_TRANSITIONS } from '@/lib/domain-workflows';

describe('workflow transitions', () => {
  it('permite transição válida de pedido', () => {
    expect(canTransition('draft', 'confirmed', ORDER_TRANSITIONS)).toBe(true);
  });

  it('bloqueia transição inválida de entrega', () => {
    expect(canTransition('pending', 'delivered', DELIVERY_TRANSITIONS)).toBe(false);
  });
});
