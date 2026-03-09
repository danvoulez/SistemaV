'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types/domain';
import clsx from 'clsx';
import {
  LayoutDashboard, Users, Package, ShoppingCart, Truck, CreditCard,
  BarChart2, Briefcase, FolderOpen, Warehouse, FileText, Settings,
  ClipboardList, StickyNote, Calendar, ChevronRight, Bot, DollarSign,
  Building2, SquareStack
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'Dashboard': LayoutDashboard,
  'People': Users,
  'Products': Package,
  'Orders': ShoppingCart,
  'Deliveries': Truck,
  'Banking': CreditCard,
  'Finance': DollarSign,
  'Office': Briefcase,
  'Files': FolderOpen,
  'Inventory': Warehouse,
  'Reports': BarChart2,
  'Settings': Settings,
  'Operations Dashboard': LayoutDashboard,
  'Active Orders': ShoppingCart,
  'Delivery Board': Truck,
  'Inventory Ops': Warehouse,
  'Tasks': ClipboardList,
  'Notes': StickyNote,
  'Customers': Users,
  'Upload': FolderOpen,
  'My Profile': Users,
  'My Orders': ShoppingCart,
  'My Deliveries': Truck,
  'My Files': FolderOpen,
  'AI Assistant': Bot,
  'Budgets': BarChart2,
  'Calendar': Calendar,
  'Tenant': Building2,
  'Objects': SquareStack,
  'Finance Dashboard': DollarSign,
  'Finance Entries': FileText,
};

export function Sidebar({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col border-r bg-slate-900 text-white w-[260px] min-h-screen">
      <div className="px-5 py-5 border-b border-slate-700">
        <h1 className="font-bold text-lg text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">SistemaV</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = iconMap[item.label] ?? ChevronRight;
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/ops' && item.href !== '/client' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={16} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">v1.0 · Multi-tenant</p>
      </div>
    </aside>
  );
}
