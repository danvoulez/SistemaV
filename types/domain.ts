export type Role = 'admin' | 'member' | 'client';

export type NavItem = {
  label: string;
  href: string;
};

export type Kpi = {
  label: string;
  value: string;
  trend?: string;
};

export type DeliveryEvent = {
  id: string;
  eventType: string;
  description?: string;
  createdAt: string;
};
