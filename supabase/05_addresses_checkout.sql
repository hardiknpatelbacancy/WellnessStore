-- Add addresses + attach address info to orders for checkout

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one default address per user
create unique index if not exists addresses_one_default_per_user
on public.addresses(user_id)
where is_default;

alter table public.addresses enable row level security;

-- Admin can do everything
create policy "addresses_admin_all"
on public.addresses
for all
using (public.is_admin())
with check (public.is_admin());

-- Customers can manage their own addresses
create policy "addresses_customer_select_own"
on public.addresses
for select
using (user_id = auth.uid());

create policy "addresses_customer_insert_own"
on public.addresses
for insert
with check (user_id = auth.uid());

create policy "addresses_customer_update_own"
on public.addresses
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "addresses_customer_delete_own"
on public.addresses
for delete
using (user_id = auth.uid());

-- Orders: add optional address reference + snapshot
alter table public.orders
  add column if not exists address_id uuid references public.addresses(id),
  add column if not exists shipping_address jsonb;

