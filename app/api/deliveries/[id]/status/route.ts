import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { DELIVERY_TRANSITIONS, canTransition } from '@/lib/domain-workflows';
import { DeliveryStatusUpdateSchema } from '@/lib/domain-schemas';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'member'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = DeliveryStatusUpdateSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  const { data: delivery } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!delivery) return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });

  if (!canTransition(delivery.status, parsed.data.status, DELIVERY_TRANSITIONS)) {
    return NextResponse.json({ error: `Transição inválida: ${delivery.status} -> ${parsed.data.status}` }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc('api_updateDeliveryStatus', {
    payload: {
      delivery_id: id,
      caller_tenant_id: profile.tenant_id,
      status: parsed.data.status,
      event_type: parsed.data.status,
      description: parsed.data.description ?? `Status atualizado para ${parsed.data.status}`,
      created_by: user.id
    }
  });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const res = await PATCH(request, context);
  if (res.ok) {
    const { id } = await context.params;
    return NextResponse.redirect(new URL(`/admin/deliveries/${id}`, request.url));
  }
  return res;
}
