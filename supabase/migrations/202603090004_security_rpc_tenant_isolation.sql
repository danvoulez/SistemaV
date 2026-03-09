-- Add caller_tenant_id verification to RPCs that operate on entities by ID.
-- These functions receive caller_tenant_id from the Edge Function (stamped from the
-- verified JWT) and verify the target entity belongs to that tenant before mutating.

-- Also fix RPC calling convention: all functions now accept a single `payload jsonb`
-- parameter, matching how Edge Functions call them via supabase.rpc('fn', { payload }).

create or replace function public.api_confirmOrder(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid := (payload->>'order_id')::uuid;
  v_caller_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_order record;
begin
  select * into v_order from public.sales_orders where id = v_order_id for update;

  if v_order is null then
    raise exception 'Order not found';
  end if;

  if v_caller_tenant_id is null or v_order.tenant_id <> v_caller_tenant_id then
    raise exception 'Access denied';
  end if;

  if v_order.status <> 'draft' then
    raise exception 'Only draft orders can be confirmed';
  end if;

  update public.sales_orders set status = 'confirmed', updated_at = now() where id = v_order_id;

  if coalesce((payload->>'create_finance_entry')::boolean, false) then
    insert into public.finance_entries (tenant_id, type, amount, currency, description, occurred_at, reference_type, reference_id, created_by)
    values (v_order.tenant_id, 'income', v_order.total_amount, 'BRL', 'Order confirmation', now(), 'sales_order', v_order_id, v_order.seller_profile_id);
  end if;

  return jsonb_build_object('order_id', v_order_id, 'status', 'confirmed');
end;
$$;

create or replace function public.api_registerPayment(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid := (payload->>'order_id')::uuid;
  v_caller_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_bank_account_id uuid := (payload->>'bank_account_id')::uuid;
  v_amount numeric(12,2) := (payload->>'amount')::numeric;
  v_currency text := coalesce(payload->>'currency', 'BRL');
  v_tenant_id uuid;
  v_total_paid numeric(12,2);
  v_total_amount numeric(12,2);
begin
  select tenant_id, total_amount into v_tenant_id, v_total_amount from public.sales_orders where id = v_order_id;

  if v_tenant_id is null then
    raise exception 'Order not found';
  end if;

  if v_caller_tenant_id is null or v_tenant_id <> v_caller_tenant_id then
    raise exception 'Access denied';
  end if;

  insert into public.bank_transactions (tenant_id, bank_account_id, type, amount, currency, occurred_at, description, reference_type, reference_id, status)
  values (v_tenant_id, v_bank_account_id, 'income', v_amount, v_currency, now(), payload->>'description', 'sales_order', v_order_id, 'posted');

  select coalesce(sum(amount),0) into v_total_paid
  from public.bank_transactions
  where tenant_id = v_tenant_id and reference_type = 'sales_order' and reference_id = v_order_id and type = 'income';

  update public.sales_orders
  set payment_status = case
    when v_total_paid >= v_total_amount then 'paid'
    when v_total_paid > 0 then 'partial'
    else 'pending'
  end,
  status = case when v_total_paid >= v_total_amount and status = 'confirmed' then 'paid' else status end,
  updated_at = now()
  where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'total_paid', v_total_paid);
end;
$$;

create or replace function public.api_createDelivery(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_delivery_id uuid;
  v_caller_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_order public.sales_orders;
begin
  select * into v_order from public.sales_orders where id = (payload->>'order_id')::uuid;

  if v_order is null then
    raise exception 'Order not found';
  end if;

  if v_caller_tenant_id is null or v_order.tenant_id <> v_caller_tenant_id then
    raise exception 'Access denied';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Cancelled orders cannot create deliveries';
  end if;

  insert into public.deliveries (tenant_id, order_id, recipient_person_id, address_id, delivery_type, status, scheduled_for, notes)
  values (
    v_order.tenant_id,
    v_order.id,
    coalesce(nullif(payload->>'recipient_person_id','')::uuid, v_order.customer_person_id),
    nullif(payload->>'address_id','')::uuid,
    coalesce((payload->>'delivery_type')::public.delivery_type, 'local_delivery'),
    'pending',
    nullif(payload->>'scheduled_for','')::timestamptz,
    payload->>'notes'
  ) returning id into v_delivery_id;

  insert into public.delivery_events (tenant_id, delivery_id, event_type, description, created_by)
  values (v_order.tenant_id, v_delivery_id, 'created', 'Delivery created from order', nullif(payload->>'created_by','')::uuid);

  return jsonb_build_object('delivery_id', v_delivery_id);
end;
$$;

create or replace function public.api_updateDeliveryStatus(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_delivery_id uuid := (payload->>'delivery_id')::uuid;
  v_caller_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_status public.delivery_status := (payload->>'status')::public.delivery_status;
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id from public.deliveries where id = v_delivery_id;

  if v_tenant_id is null then
    raise exception 'Delivery not found';
  end if;

  if v_caller_tenant_id is null or v_tenant_id <> v_caller_tenant_id then
    raise exception 'Access denied';
  end if;

  update public.deliveries
  set status = v_status,
      dispatched_at = case when v_status = 'in_transit' then now() else dispatched_at end,
      delivered_at = case when v_status = 'delivered' then now() else delivered_at end,
      proof_file_id = coalesce(nullif(payload->>'proof_file_id','')::uuid, proof_file_id),
      updated_at = now()
  where id = v_delivery_id;

  insert into public.delivery_events (tenant_id, delivery_id, event_type, description, latitude, longitude, created_by)
  values (
    v_tenant_id,
    v_delivery_id,
    payload->>'event_type',
    payload->>'description',
    nullif(payload->>'latitude','')::numeric,
    nullif(payload->>'longitude','')::numeric,
    nullif(payload->>'created_by','')::uuid
  );

  return jsonb_build_object('delivery_id', v_delivery_id, 'status', v_status);
end;
$$;
