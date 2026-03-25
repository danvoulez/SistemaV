import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { ORDER_TRANSITIONS, canTransition } from '@/lib/domain-workflows';
import { OrderStatusUpdateSchema } from '@/lib/domain-schemas';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'member'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = OrderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  const { data: order } = await supabase.from('sales_orders').select('status').eq('id', id).eq('tenant_id', profile.tenant_id).single();
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

  if (!canTransition(order.status, parsed.data.status, ORDER_TRANSITIONS)) {
    return NextResponse.json({ error: `Transição inválida: ${order.status} -> ${parsed.data.status}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sales_orders')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
