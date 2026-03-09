import { createSupabaseServerClient } from './supabase-server';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'member' | 'client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  fullName: string;
  avatarUrl?: string;
  personId?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id, role, full_name, avatar_url, person_id')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      email: user.email ?? '',
      role: profile.role as UserRole,
      tenantId: profile.tenant_id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      personId: profile.person_id
    };
  } catch {
    return null;
  }
}

export async function requireAuth(role?: UserRole): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (role && user.role !== role && !(role === 'member' && user.role === 'admin')) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/ops');
  return user;
}

export async function requireMemberOrAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role === 'client') redirect('/client');
  return user;
}
