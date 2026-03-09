import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { opsNav } from '@/lib/navigation';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OpsLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role === 'client') redirect('/client');

  return (
    <AppShell
      title="Operações"
      navItems={opsNav}
      userName={user.fullName}
      userRole={user.role}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}
