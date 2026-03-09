import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopNav } from '@/components/top-nav';
import { NavItem } from '@/types/domain';

export function AppShell({ title, navItems, children }: { title: string; navItems: NavItem[]; children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <Sidebar title={title} items={navItems} />
      <main className="p-4 md:p-6 space-y-6">
        <TopNav title={title} />
        {children}
      </main>
    </div>
  );
}
