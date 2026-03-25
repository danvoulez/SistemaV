import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { InventoryMovementSchema } from '@/lib/domain-schemas';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'member'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = InventoryMovementSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  const { error } = await supabase.rpc('api_recordInventoryMovement', {
    payload: {
      tenant_id: profile.tenant_id,
      caller_tenant_id: profile.tenant_id,
      merchandise_id: parsed.data.merchandiseId,
      location_id: parsed.data.locationId,
      movement_type: parsed.data.movementType,
      quantity: parsed.data.quantity,
      unit_cost: parsed.data.unitCost,
      reference_type: parsed.data.referenceType,
      reference_id: parsed.data.referenceId,
      created_by: user.id
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
