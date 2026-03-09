import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { clientNav } from '@/lib/navigation';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AppShell title="Client Portal" navItems={clientNav}>{children}</AppShell>;
}
