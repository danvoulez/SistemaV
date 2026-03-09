import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { updateOrderStatus } from '@/services/orders';

export async function PATCH(
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

  const body = await request.json();
  const { status } = body as { status: string };

  try {
    const order = await updateOrderStatus(id, profile.tenant_id, status);
    return NextResponse.json({ order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
    const code = message === 'Order not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status: code });
  }
}
