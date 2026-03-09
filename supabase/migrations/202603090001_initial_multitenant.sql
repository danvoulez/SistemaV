create extension if not exists pgcrypto;

create type public.user_role as enum ('admin','member','client');
create type public.person_type as enum ('individual','company');
create type public.order_status as enum ('draft','confirmed','paid','cancelled','packed','shipped','delivered');
create type public.payment_status as enum ('pending','partial','paid','refunded');
create type public.delivery_type as enum ('pickup','local_delivery','third_party');
create type public.delivery_status as enum ('pending','scheduled','in_transit','delivered','failed','returned');
create type public.bank_tx_type as enum ('income','expense','transfer','refund');
create type public.task_priority as enum ('low','medium','high','urgent');
create type public.task_status as enum ('todo','in_progress','blocked','done');
create type public.note_visibility as enum ('private','team');
create type public.finance_type as enum ('income','expense');
create type public.object_owner_type as enum ('person','tenant');
create type public.object_type as enum ('identity_document','digital_file','archive_item','merchandise');
create type public.inventory_movement_type as enum ('in','out','adjustment','reservation','release','transfer');

create table public.tenants (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.people (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, type public.person_type not null, full_name text not null, display_name text, document_type text, document_number text, birth_date date, email text, phone text, notes text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.profiles (id uuid primary key references auth.users(id), tenant_id uuid not null references public.tenants(id) on delete cascade, person_id uuid references public.people(id), email text not null, full_name text not null, role public.user_role not null, status text not null default 'active', avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.addresses (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, person_id uuid references public.people(id) on delete cascade, label text not null, street text not null, number text not null, complement text, district text, city text not null, state text not null, postal_code text not null, country text not null, latitude numeric, longitude numeric, is_default boolean not null default false, created_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, description text, sku text not null, barcode text, price numeric(12,2) not null, cost_price numeric(12,2), category text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, sku));
create table public.sales_orders (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, customer_person_id uuid not null references public.people(id), seller_profile_id uuid references public.profiles(id), order_number text not null, status public.order_status not null default 'draft', subtotal_amount numeric(12,2) not null default 0, discount_amount numeric(12,2) not null default 0, delivery_amount numeric(12,2) not null default 0, total_amount numeric(12,2) not null default 0, payment_status public.payment_status not null default 'pending', payment_method text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, order_number));
create table public.sales_order_items (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, order_id uuid not null references public.sales_orders(id) on delete cascade, product_id uuid references public.products(id), product_name_snapshot text not null, sku_snapshot text, unit_price numeric(12,2) not null, quantity numeric(12,2) not null, discount_amount numeric(12,2) not null default 0, line_total numeric(12,2) not null, created_at timestamptz not null default now());
create table public.digital_files (id uuid primary key default gen_random_uuid(), object_id uuid unique, storage_bucket text not null, storage_path text not null, mime_type text, size_bytes bigint, checksum text, uploaded_by uuid references public.profiles(id), uploaded_at timestamptz not null default now());
create table public.deliveries (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, order_id uuid not null references public.sales_orders(id), recipient_person_id uuid references public.people(id), address_id uuid references public.addresses(id), delivery_type public.delivery_type not null, status public.delivery_status not null default 'pending', scheduled_for timestamptz, dispatched_at timestamptz, delivered_at timestamptz, proof_file_id uuid references public.digital_files(id), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.delivery_events (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, delivery_id uuid not null references public.deliveries(id) on delete cascade, event_type text not null, description text, latitude numeric, longitude numeric, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.bank_accounts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, institution text not null, account_type text not null, currency text not null, current_balance numeric(12,2) not null default 0, external_provider text, external_account_ref text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.bank_transactions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, bank_account_id uuid not null references public.bank_accounts(id), type public.bank_tx_type not null, amount numeric(12,2) not null, currency text not null, occurred_at timestamptz not null, description text, reference_type text, reference_id uuid, external_txn_ref text, status text not null default 'posted', created_at timestamptz not null default now());
create table public.tasks (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, title text not null, description text, assigned_to_profile_id uuid references public.profiles(id), created_by uuid references public.profiles(id), due_date date, priority public.task_priority not null default 'medium', status public.task_status not null default 'todo', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.notes (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, title text, content text not null, visibility public.note_visibility not null default 'team', created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.calendar_events (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, title text not null, description text, starts_at timestamptz not null, ends_at timestamptz, created_by uuid references public.profiles(id), related_type text, related_id uuid, created_at timestamptz not null default now());
create table public.finance_categories (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, type public.finance_type not null, created_at timestamptz not null default now());
create table public.finance_entries (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, category_id uuid references public.finance_categories(id), type public.finance_type not null, amount numeric(12,2) not null, currency text not null, description text, occurred_at timestamptz not null, reference_type text, reference_id uuid, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.budgets (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, category_id uuid references public.finance_categories(id), allocated_amount numeric(12,2) not null, spent_amount numeric(12,2) not null default 0, period_start date not null, period_end date not null, created_at timestamptz not null default now());
create table public.objects (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, owner_type public.object_owner_type not null, owner_person_id uuid references public.people(id), owner_tenant_id uuid references public.tenants(id), object_type public.object_type not null, title text not null, description text, status text, tag_code text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check ((owner_type='person' and owner_person_id is not null and owner_tenant_id is null) or (owner_type='tenant' and owner_tenant_id is not null and owner_person_id is null)));
create table public.identity_documents (id uuid primary key default gen_random_uuid(), object_id uuid unique not null references public.objects(id) on delete cascade, document_kind text not null, document_number text not null, issued_by text, issued_at date, expires_at date, validation_status text);
alter table public.digital_files add constraint digital_files_object_id_fkey foreign key (object_id) references public.objects(id) on delete cascade;
create table public.archive_items (id uuid primary key default gen_random_uuid(), object_id uuid unique not null references public.objects(id) on delete cascade, category text, serial_number text, condition text, estimated_value numeric(12,2), location_label text);
create table public.merchandise (id uuid primary key default gen_random_uuid(), object_id uuid unique not null references public.objects(id) on delete cascade, sku text unique not null, barcode text, unit text not null, sale_price numeric(12,2) not null, cost_price numeric(12,2), track_stock boolean not null default true, min_stock numeric(12,2) not null default 0, is_active boolean not null default true);
create table public.inventory_locations (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, name text not null, type text not null, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.inventory_movements (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, merchandise_id uuid not null references public.merchandise(id), location_id uuid not null references public.inventory_locations(id), movement_type public.inventory_movement_type not null, quantity numeric(12,2) not null, unit_cost numeric(12,2), reference_type text, reference_id uuid, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.inventory_balances (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, merchandise_id uuid not null references public.merchandise(id), location_id uuid not null references public.inventory_locations(id), quantity_on_hand numeric(12,2) not null default 0, quantity_reserved numeric(12,2) not null default 0, quantity_available numeric(12,2) not null default 0, updated_at timestamptz not null default now(), unique(tenant_id, merchandise_id, location_id));

create or replace function public.current_tenant_id() returns uuid language sql stable as $$ select tenant_id from public.profiles where id = auth.uid() $$;
create or replace function public.current_user_role() returns public.user_role language sql stable as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.current_person_id() returns uuid language sql stable as $$ select person_id from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable as $$ select public.current_user_role() = 'admin'::public.user_role $$;
create or replace function public.is_member() returns boolean language sql stable as $$ select public.current_user_role() = 'member'::public.user_role $$;
create or replace function public.is_client() returns boolean language sql stable as $$ select public.current_user_role() = 'client'::public.user_role $$;

create or replace function public.apply_standard_tenant_policies(tablename text, allow_client_person boolean default false) returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', tablename);
  execute format('create policy %I_tenant_read on public.%I for select using (tenant_id = public.current_tenant_id() and (public.is_admin() or public.is_member() or (public.is_client() and %L)))', tablename, tablename, allow_client_person);
  execute format('create policy %I_tenant_write on public.%I for all using (tenant_id = public.current_tenant_id() and (public.is_admin() or public.is_member())) with check (tenant_id = public.current_tenant_id() and (public.is_admin() or public.is_member()))', tablename, tablename);
end; $$;

select public.apply_standard_tenant_policies('people', true);
select public.apply_standard_tenant_policies('addresses', true);
select public.apply_standard_tenant_policies('products');
select public.apply_standard_tenant_policies('sales_orders', true);
select public.apply_standard_tenant_policies('sales_order_items');
select public.apply_standard_tenant_policies('deliveries', true);
select public.apply_standard_tenant_policies('delivery_events');
select public.apply_standard_tenant_policies('bank_accounts');
select public.apply_standard_tenant_policies('bank_transactions');
select public.apply_standard_tenant_policies('tasks');
select public.apply_standard_tenant_policies('calendar_events');
select public.apply_standard_tenant_policies('finance_categories');
select public.apply_standard_tenant_policies('finance_entries');
select public.apply_standard_tenant_policies('budgets');
select public.apply_standard_tenant_policies('objects', true);
select public.apply_standard_tenant_policies('inventory_locations');
select public.apply_standard_tenant_policies('inventory_movements');
select public.apply_standard_tenant_policies('inventory_balances');

alter table public.notes enable row level security;
create policy notes_read on public.notes for select using (tenant_id = public.current_tenant_id() and ((visibility='team' and (public.is_admin() or public.is_member())) or (created_by = auth.uid()) or (public.is_admin())));
create policy notes_write on public.notes for all using (tenant_id = public.current_tenant_id() and (public.is_admin() or public.is_member())) with check (tenant_id = public.current_tenant_id());

alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select using (tenant_id = public.current_tenant_id());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

alter table public.tenants enable row level security;
create policy tenants_read on public.tenants for select using (id = public.current_tenant_id());
