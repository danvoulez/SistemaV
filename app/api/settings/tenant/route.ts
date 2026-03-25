import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { TenantNameSchema } from '@/lib/domain-schemas';

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = TenantNameSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });

  const { error } = await supabase.from('tenants').update({ name: parsed.data.name, updated_at: new Date().toISOString() }).eq('id', profile.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
