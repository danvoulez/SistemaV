import { NavItem, Role } from '@/types/domain';

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'People', href: '/admin/people' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Deliveries', href: '/admin/deliveries' },
  { label: 'Banking', href: '/admin/banking' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Office', href: '/admin/office' },
  { label: 'Files', href: '/admin/files' },
  { label: 'Inventory', href: '/admin/inventory' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Settings', href: '/admin/settings' }
];

export const opsNav: NavItem[] = [
  { label: 'Operations Dashboard', href: '/ops' },
  { label: 'Active Orders', href: '/ops/orders' },
  { label: 'Delivery Board', href: '/ops/deliveries' },
  { label: 'Inventory Ops', href: '/ops/inventory' },
  { label: 'Tasks', href: '/ops/tasks' },
  { label: 'Notes', href: '/ops/notes' },
  { label: 'Customers', href: '/ops/customers' },
  { label: 'Upload', href: '/ops/files' }
];

export const clientNav: NavItem[] = [
  { label: 'Dashboard', href: '/client' },
  { label: 'My Profile', href: '/client/profile' },
  { label: 'My Orders', href: '/client/orders' },
  { label: 'My Deliveries', href: '/client/deliveries' },
  { label: 'My Files', href: '/client/files' }
];

export const navByRole: Record<Role, NavItem[]> = {
  admin: adminNav,
  member: opsNav,
  client: clientNav
};
