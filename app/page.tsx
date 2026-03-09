import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role === 'admin') redirect('/admin');
  if (user.role === 'member') redirect('/ops');
  redirect('/client');
}
