export type MovementType = 'in' | 'out' | 'reservation' | 'release' | 'adjustment' | 'transfer';

export function applyMovement(balance: { onHand: number; reserved: number }, movement: { movementType: MovementType; quantity: number }) {
  const onHandDelta = ['in', 'adjustment', 'transfer'].includes(movement.movementType)
    ? movement.quantity
    : movement.movementType === 'out'
      ? -movement.quantity
      : 0;
  const reservedDelta = movement.movementType === 'reservation' ? movement.quantity : movement.movementType === 'release' ? -movement.quantity : 0;
  const onHand = balance.onHand + onHandDelta;
  const reserved = Math.max(0, balance.reserved + reservedDelta);
  return { onHand, reserved, available: onHand - reserved };
}
