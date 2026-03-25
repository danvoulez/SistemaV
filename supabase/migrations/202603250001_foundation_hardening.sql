-- Production hardening: tenant-safe FKs, storage policies, and RPC tenant stamping.

create unique index if not exists people_tenant_id_id_uq on public.people (tenant_id, id);
create unique index if not exists profiles_tenant_id_id_uq on public.profiles (tenant_id, id);
create unique index if not exists addresses_tenant_id_id_uq on public.addresses (tenant_id, id);
create unique index if not exists sales_orders_tenant_id_id_uq on public.sales_orders (tenant_id, id);
create unique index if not exists products_tenant_id_id_uq on public.products (tenant_id, id);
create unique index if not exists deliveries_tenant_id_id_uq on public.deliveries (tenant_id, id);
create unique index if not exists inventory_locations_tenant_id_id_uq on public.inventory_locations (tenant_id, id);
create unique index if not exists merchandise_tenant_id_id_uq on public.merchandise (tenant_id, id);
create unique index if not exists finance_categories_tenant_id_id_uq on public.finance_categories (tenant_id, id);
create unique index if not exists bank_accounts_tenant_id_id_uq on public.bank_accounts (tenant_id, id);

alter table public.addresses drop constraint if exists addresses_person_tenant_fk;
alter table public.addresses add constraint addresses_person_tenant_fk foreign key (tenant_id, person_id) references public.people(tenant_id, id) on delete cascade;

alter table public.sales_orders drop constraint if exists sales_orders_customer_tenant_fk;
alter table public.sales_orders add constraint sales_orders_customer_tenant_fk foreign key (tenant_id, customer_person_id) references public.people(tenant_id, id);
alter table public.sales_orders drop constraint if exists sales_orders_seller_tenant_fk;
alter table public.sales_orders add constraint sales_orders_seller_tenant_fk foreign key (tenant_id, seller_profile_id) references public.profiles(tenant_id, id);

alter table public.sales_order_items drop constraint if exists soi_order_tenant_fk;
alter table public.sales_order_items add constraint soi_order_tenant_fk foreign key (tenant_id, order_id) references public.sales_orders(tenant_id, id) on delete cascade;
alter table public.sales_order_items drop constraint if exists soi_product_tenant_fk;
alter table public.sales_order_items add constraint soi_product_tenant_fk foreign key (tenant_id, product_id) references public.products(tenant_id, id);

alter table public.deliveries drop constraint if exists deliveries_order_tenant_fk;
alter table public.deliveries add constraint deliveries_order_tenant_fk foreign key (tenant_id, order_id) references public.sales_orders(tenant_id, id);
alter table public.deliveries drop constraint if exists deliveries_recipient_tenant_fk;
alter table public.deliveries add constraint deliveries_recipient_tenant_fk foreign key (tenant_id, recipient_person_id) references public.people(tenant_id, id);
alter table public.deliveries drop constraint if exists deliveries_address_tenant_fk;
alter table public.deliveries add constraint deliveries_address_tenant_fk foreign key (tenant_id, address_id) references public.addresses(tenant_id, id);

alter table public.inventory_movements drop constraint if exists inventory_movements_merchandise_tenant_fk;
alter table public.inventory_movements add constraint inventory_movements_merchandise_tenant_fk foreign key (tenant_id, merchandise_id) references public.merchandise(tenant_id, id);
alter table public.inventory_movements drop constraint if exists inventory_movements_location_tenant_fk;
alter table public.inventory_movements add constraint inventory_movements_location_tenant_fk foreign key (tenant_id, location_id) references public.inventory_locations(tenant_id, id);

alter table public.inventory_balances drop constraint if exists inventory_balances_merchandise_tenant_fk;
alter table public.inventory_balances add constraint inventory_balances_merchandise_tenant_fk foreign key (tenant_id, merchandise_id) references public.merchandise(tenant_id, id);
alter table public.inventory_balances drop constraint if exists inventory_balances_location_tenant_fk;
alter table public.inventory_balances add constraint inventory_balances_location_tenant_fk foreign key (tenant_id, location_id) references public.inventory_locations(tenant_id, id);

-- Harden RPCs to ignore browser tenant_id and rely on caller_tenant_id
create or replace function public.api_recordInventoryMovement(payload jsonb)
returns jsonb language plpgsql security definer as $$
declare
  v_id uuid;
  v_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_merchandise_id uuid := (payload->>'merchandise_id')::uuid;
  v_location_id uuid := (payload->>'location_id')::uuid;
begin
  if v_tenant_id is null then raise exception 'Access denied'; end if;
  insert into public.inventory_movements (tenant_id, merchandise_id, location_id, movement_type, quantity, unit_cost, reference_type, reference_id, created_by)
  values (v_tenant_id, v_merchandise_id, v_location_id, (payload->>'movement_type')::public.inventory_movement_type, (payload->>'quantity')::numeric, nullif(payload->>'unit_cost','')::numeric, payload->>'reference_type', nullif(payload->>'reference_id','')::uuid, nullif(payload->>'created_by','')::uuid)
  returning id into v_id;
  perform public.recalculate_inventory_balance(v_tenant_id, v_merchandise_id, v_location_id);
  return jsonb_build_object('movement_id', v_id);
end; $$;

create or replace function public.api_createOrderDraft(payload jsonb)
returns jsonb language plpgsql security definer as $$
declare
  v_order_id uuid; v_item jsonb; v_subtotal numeric(12,2) := 0;
  v_tenant_id uuid := (payload->>'caller_tenant_id')::uuid;
  v_line_total numeric(12,2);
begin
  if v_tenant_id is null then raise exception 'Access denied'; end if;
  insert into public.sales_orders (tenant_id, customer_person_id, seller_profile_id, order_number, status, discount_amount, delivery_amount)
  values (v_tenant_id, (payload->>'customer_person_id')::uuid, nullif(payload->>'seller_profile_id','')::uuid, payload->>'order_number', 'draft', coalesce((payload->>'discount_amount')::numeric,0), coalesce((payload->>'delivery_amount')::numeric,0))
  returning id into v_order_id;
  for v_item in select * from jsonb_array_elements(coalesce(payload->'items', '[]'::jsonb)) loop
    v_line_total := ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::numeric) - coalesce((v_item->>'discount_amount')::numeric, 0);
    v_subtotal := v_subtotal + v_line_total;
    insert into public.sales_order_items (tenant_id, order_id, product_id, product_name_snapshot, sku_snapshot, unit_price, quantity, discount_amount, line_total)
    values (v_tenant_id, v_order_id, nullif(v_item->>'product_id','')::uuid, coalesce(v_item->>'product_name_snapshot', v_item->>'name'), v_item->>'sku_snapshot', (v_item->>'unit_price')::numeric, (v_item->>'quantity')::numeric, coalesce((v_item->>'discount_amount')::numeric, 0), v_line_total);
  end loop;
  update public.sales_orders set subtotal_amount = v_subtotal, total_amount = (v_subtotal - coalesce((payload->>'discount_amount')::numeric,0) + coalesce((payload->>'delivery_amount')::numeric,0)), updated_at = now() where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id);
end; $$;

-- storage policies
alter table storage.objects enable row level security;

drop policy if exists tenant_private_insert on storage.objects;
create policy tenant_private_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('private-files','identity-documents','delivery-proofs')
  and split_part(name, '/', 1) = public.current_tenant_id()::text
);

drop policy if exists tenant_private_read on storage.objects;
create policy tenant_private_read on storage.objects for select to authenticated using (
  bucket_id in ('private-files','identity-documents','delivery-proofs')
  and split_part(name, '/', 1) = public.current_tenant_id()::text
);

drop policy if exists tenant_public_read on storage.objects;
create policy tenant_public_read on storage.objects for select using (bucket_id in ('public-files','avatars'));

drop policy if exists tenant_public_insert on storage.objects;
create policy tenant_public_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('public-files','avatars')
  and split_part(name, '/', 1) = public.current_tenant_id()::text
);
