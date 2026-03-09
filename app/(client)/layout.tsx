import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { clientNav } from '@/lib/navigation';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return (
    <AppShell
      title="Portal do Cliente"
      navItems={clientNav}
      userName={user.fullName}
      userRole={user.role}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}
