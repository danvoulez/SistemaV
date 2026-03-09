import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

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
  const { status, description } = body as { status: string; description?: string };

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'in_transit') updates.dispatched_at = new Date().toISOString();
  if (status === 'delivered') updates.delivered_at = new Date().toISOString();

  const { data: delivery, error } = await supabase
    .from('deliveries')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Record event
  await supabase.from('delivery_events').insert({
    tenant_id: profile.tenant_id,
    delivery_id: id,
    event_type: status,
    description: description ?? `Status atualizado para ${status}`,
    created_by: user.id
  });

  return NextResponse.json({ delivery });
}
