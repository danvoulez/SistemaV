import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { confirmOrder } from '@/services/orders';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'member'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const order = await confirmOrder(id, profile.tenant_id);
    return NextResponse.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao confirmar pedido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
