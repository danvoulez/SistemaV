import { describe, it, expect } from 'vitest';
import { applyMovement } from '@/lib/inventory-balance';

describe('inventory balance', () => {
  it('recalcula saldo com entrada e reserva', () => {
    const afterIn = applyMovement({ onHand: 0, reserved: 0 }, { movementType: 'in', quantity: 10 });
    const afterReservation = applyMovement({ onHand: afterIn.onHand, reserved: afterIn.reserved }, { movementType: 'reservation', quantity: 3 });
    expect(afterReservation.onHand).toBe(10);
    expect(afterReservation.reserved).toBe(3);
    expect(afterReservation.available).toBe(7);
  });
});
