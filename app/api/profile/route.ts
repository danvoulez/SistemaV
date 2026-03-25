import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ProfileNameSchema } from '@/lib/domain-schemas';

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ProfileNameSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });

  const { error } = await supabase.from('profiles').update({ full_name: parsed.data.fullName, updated_at: new Date().toISOString() }).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
