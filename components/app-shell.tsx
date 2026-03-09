import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopNav } from '@/components/top-nav';
import { NavItem } from '@/types/domain';

interface AppShellProps {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export function AppShell({ title, navItems, children, userName, userRole, userEmail }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar title={title} items={navItems} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav title={title} userName={userName} userRole={userRole} userEmail={userEmail} />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
