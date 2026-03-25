import { z } from 'zod';

export const OrderStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'])
});

export const DeliveryStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'in_transit', 'delivered', 'failed', 'returned']),
  description: z.string().max(500).optional()
});

export const InventoryMovementSchema = z.object({
  merchandiseId: z.string().uuid(),
  locationId: z.string().uuid(),
  movementType: z.enum(['in', 'out', 'reservation', 'release', 'adjustment', 'transfer']),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional()
});

export const ProfileNameSchema = z.object({
  fullName: z.string().trim().min(3).max(120)
});

export const TenantNameSchema = z.object({
  name: z.string().trim().min(3).max(120)
});
