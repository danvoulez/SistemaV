import { DeliveryEvent, Kpi } from '@/types/domain';

export const dashboardKpis: Kpi[] = [
  { label: 'Total Sales', value: '$58,420', trend: '+12%' },
  { label: 'Total Orders', value: '152', trend: '+7%' },
  { label: 'Pending Deliveries', value: '18', trend: '-3%' },
  { label: 'Revenue Summary', value: '$39,120', trend: '+9%' },
  { label: 'Expense Summary', value: '$14,510', trend: '+2%' },
  { label: 'Low Stock Items', value: '6', trend: '+1' },
  { label: 'Active Tasks', value: '22', trend: '-4' }
];

export const deliveryTimeline: DeliveryEvent[] = [
  { id: '1', eventType: 'scheduled', description: 'Delivery scheduled for route A', createdAt: '2026-03-01T09:00:00Z' },
  { id: '2', eventType: 'in_transit', description: 'Driver started route', createdAt: '2026-03-01T10:20:00Z' },
  { id: '3', eventType: 'delivered', description: 'Proof of delivery attached', createdAt: '2026-03-01T12:40:00Z' }
];
