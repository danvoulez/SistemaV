-- Permanent tenant isolation for all workflow RPCs.
--
-- Pattern: COALESCE(public.current_tenant_id(), payload_tenant)
--   - Called with user JWT  → current_tenant_id() returns real tenant; payload ignored
--   - Called with service role (edge function) → current_tenant_id() returns NULL;
--     falls back to payload value that the edge function stamped from verified JWT
--
-- This replaces the caller_tenant_id approach in migration 004 which broke direct
-- browser calls (current_tenant_id() was available but caller_tenant_id was not
-- in the payload, causing 'Access denied' for all browser-initiated calls).

create or replace function public.api_createPerson(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_person_id uuid;
  v_address_id uuid;
  v_tenant_id uuid := coalesce(public.current_tenant_id(), (payload->>'tenant_id')::uuid);
begin
  if v_tenant_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.people (tenant_id, type, full_name, display_name, document_type, document_number, birth_date, email, phone, notes)
  values (
    v_tenant_id,
    coalesce((payload->>'type')::public.person_type, 'individual'),
    payload->>'full_name',
    payload->>'display_name',
    payload->>'document_type',
    payload->>'document_number',
    nullif(payload->>'birth_date','')::date,
    payload->>'email',
    payload->>'phone',
    payload->>'notes'
  ) returning id into v_person_id;

  if payload ? 'address' then
    insert into public.addresses (tenant_id, person_id, label, street, number, city, state, postal_code, country, complement, district)
    values (
      v_tenant_id,
      v_person_id,
      coalesce(payload#>>'{address,label}', 'main'),
      payload#>>'{address,street}',
      payload#>>'{address,number}',
      payload#>>'{address,city}',
      payload#>>'{address,state}',
      payload#>>'{address,postal_code}',
      coalesce(payload#>>'{address,country}', 'BR'),
      payload#>>'{address,complement}',
      payload#>>'{address,district}'
    ) returning id into v_address_id;
  end if;

  return jsonb_build_object('person_id', v_person_id, 'address_id', v_address_id);
end;
$$;

create or replace function public.api_createOrderDraft(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_tenant_id uuid := coalesce(public.current_tenant_id(), (payload->>'tenant_id')::uuid);
  v_item jsonb;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := coalesce((payload->>'discount_amount')::numeric, 0);
  v_delivery numeric(12,2) := coalesce((payload->>'delivery_amount')::numeric, 0);
  v_line_total numeric(12,2);
begin
  if v_tenant_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.sales_orders (tenant_id, customer_person_id, seller_profile_id, order_number, status, discount_amount, delivery_amount)
  values (
    v_tenant_id,
    (payload->>'customer_person_id')::uuid,
    nullif(payload->>'seller_profile_id','')::uuid,
    payload->>'order_number',
    'draft',
    v_discount,
    v_delivery
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(coalesce(payload->'items', '[]'::jsonb))
  loop
    v_line_total := ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::numeric) - coalesce((v_item->>'discount_amount')::numeric, 0);
    v_subtotal := v_subtotal + v_line_total;

    insert into public.sales_order_items (
      tenant_id, order_id, product_id, product_name_snapshot, sku_snapshot, unit_price, quantity, discount_amount, line_total
    ) values (
      v_tenant_id,
      v_order_id,
      nullif(v_item->>'product_id','')::uuid,
      coalesce(v_item->>'product_name_snapshot', v_item->>'name'),
      v_item->>'sku_snapshot',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::numeric,
      coalesce((v_item->>'discount_amount')::numeric, 0),
      v_line_total
    );
  end loop;

  update public.sales_orders
  set subtotal_amount = v_subtotal,
      total_amount = (v_subtotal - v_discount + v_delivery),
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id);
end;
$$;

create or replace function public.api_confirmOrder(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid := (payload->>'order_id')::uuid;
  v_caller_tenant uuid := coalesce(public.current_tenant_id(), (payload->>'caller_tenant_id')::uuid);
  v_order record;
begin
  if v_caller_tenant is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_order from public.sales_orders where id = v_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.tenant_id <> v_caller_tenant then
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
  v_caller_tenant uuid := coalesce(public.current_tenant_id(), (payload->>'caller_tenant_id')::uuid);
  v_bank_account_id uuid := (payload->>'bank_account_id')::uuid;
  v_amount numeric(12,2) := (payload->>'amount')::numeric;
  v_currency text := coalesce(payload->>'currency', 'BRL');
  v_tenant_id uuid;
  v_total_paid numeric(12,2);
  v_total_amount numeric(12,2);
begin
  if v_caller_tenant is null then
    raise exception 'Unauthorized';
  end if;

  select tenant_id, total_amount into v_tenant_id, v_total_amount from public.sales_orders where id = v_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_tenant_id <> v_caller_tenant then
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
  v_caller_tenant uuid := coalesce(public.current_tenant_id(), (payload->>'caller_tenant_id')::uuid);
  v_order public.sales_orders;
begin
  if v_caller_tenant is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_order from public.sales_orders where id = (payload->>'order_id')::uuid;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.tenant_id <> v_caller_tenant then
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
  v_caller_tenant uuid := coalesce(public.current_tenant_id(), (payload->>'caller_tenant_id')::uuid);
  v_status public.delivery_status := (payload->>'status')::public.delivery_status;
  v_tenant_id uuid;
begin
  if v_caller_tenant is null then
    raise exception 'Unauthorized';
  end if;

  select tenant_id into v_tenant_id from public.deliveries where id = v_delivery_id;
  if not found then
    raise exception 'Delivery not found';
  end if;
  if v_tenant_id <> v_caller_tenant then
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

create or replace function public.api_recordInventoryMovement(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_tenant_id uuid := coalesce(public.current_tenant_id(), (payload->>'tenant_id')::uuid);
  v_merchandise_id uuid := (payload->>'merchandise_id')::uuid;
  v_location_id uuid := (payload->>'location_id')::uuid;
begin
  if v_tenant_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.inventory_movements (
    tenant_id, merchandise_id, location_id, movement_type, quantity, unit_cost, reference_type, reference_id, created_by
  ) values (
    v_tenant_id,
    v_merchandise_id,
    v_location_id,
    (payload->>'movement_type')::public.inventory_movement_type,
    (payload->>'quantity')::numeric,
    nullif(payload->>'unit_cost','')::numeric,
    payload->>'reference_type',
    nullif(payload->>'reference_id','')::uuid,
    nullif(payload->>'created_by','')::uuid
  ) returning id into v_id;

  perform public.recalculate_inventory_balance(v_tenant_id, v_merchandise_id, v_location_id);
  return jsonb_build_object('movement_id', v_id);
end;
$$;

create or replace function public.api_uploadLinkedFile(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_object_id uuid;
  v_file_id uuid;
  v_tenant_id uuid := coalesce(public.current_tenant_id(), (payload->>'tenant_id')::uuid);
begin
  if v_tenant_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.objects (
    tenant_id, owner_type, owner_person_id, owner_tenant_id, object_type, title, description, status, tag_code, created_by
  ) values (
    v_tenant_id,
    (payload->>'owner_type')::public.object_owner_type,
    nullif(payload->>'owner_person_id','')::uuid,
    nullif(payload->>'owner_tenant_id','')::uuid,
    'digital_file',
    payload->>'title',
    payload->>'description',
    payload->>'status',
    payload->>'tag_code',
    nullif(payload->>'created_by','')::uuid
  ) returning id into v_object_id;

  insert into public.digital_files (object_id, storage_bucket, storage_path, mime_type, size_bytes, checksum, uploaded_by)
  values (
    v_object_id,
    payload->>'storage_bucket',
    payload->>'storage_path',
    payload->>'mime_type',
    nullif(payload->>'size_bytes','')::bigint,
    payload->>'checksum',
    nullif(payload->>'uploaded_by','')::uuid
  ) returning id into v_file_id;

  return jsonb_build_object('object_id', v_object_id, 'file_id', v_file_id);
end;
$$;

create or replace function public.api_inviteUser(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_profile_id uuid := coalesce(nullif(payload->>'profile_id','')::uuid, gen_random_uuid());
  v_tenant_id uuid := coalesce(public.current_tenant_id(), (payload->>'tenant_id')::uuid);
begin
  if v_tenant_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.profiles (id, tenant_id, person_id, email, full_name, role, status)
  values (
    v_profile_id,
    v_tenant_id,
    nullif(payload->>'person_id','')::uuid,
    payload->>'email',
    payload->>'full_name',
    (payload->>'role')::public.user_role,
    'invited'
  );

  return jsonb_build_object('profile_id', v_profile_id, 'status', 'invited');
end;
$$;
