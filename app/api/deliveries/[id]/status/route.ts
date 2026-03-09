import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { updateDeliveryStatus } from '@/services/deliveries';

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

  try {
    const delivery = await updateDeliveryStatus(id, profile.tenant_id, status, description, user.id);
    return NextResponse.json({ delivery });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
