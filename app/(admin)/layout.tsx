import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { adminNav } from '@/lib/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell title="Admin / Backoffice" navItems={adminNav}>{children}</AppShell>;
}
