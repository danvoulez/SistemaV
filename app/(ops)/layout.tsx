import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { opsNav } from '@/lib/navigation';

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <AppShell title="Team / Operations" navItems={opsNav}>{children}</AppShell>;
}
