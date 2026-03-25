import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  sku: z.string().optional(),
  unit_price: z.number().nonnegative(),
  quantity: z.number().positive()
});

const OrderSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(ItemSchema).min(1)
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'member'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = OrderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`;

  const { data, error } = await supabase.rpc('api_createOrderDraft', {
    payload: {
      caller_tenant_id: profile.tenant_id,
      customer_person_id: parsed.data.customerId,
      order_number: orderNumber,
      notes: parsed.data.notes,
      items: parsed.data.items.map((i) => ({
        product_id: i.product_id,
        product_name_snapshot: i.product_name,
        sku_snapshot: i.sku,
        unit_price: i.unit_price,
        quantity: i.quantity,
        discount_amount: 0
      }))
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ orderId: (data as { order_id: string }).order_id });
}
