insert into storage.buckets (id, name, public) values
('private-files','private-files', false),
('public-files','public-files', true),
('identity-documents','identity-documents', false),
('delivery-proofs','delivery-proofs', false),
('avatars','avatars', true)
on conflict (id) do nothing;

alter publication supabase_realtime add table public.sales_orders;
alter publication supabase_realtime add table public.deliveries;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.inventory_balances;
