import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { adminNav } from '@/lib/navigation';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect(user.role === 'client' ? '/client' : '/ops');

  return (
    <AppShell
      title="Admin / Backoffice"
      navItems={adminNav}
      userName={user.fullName}
      userRole={user.role}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}
