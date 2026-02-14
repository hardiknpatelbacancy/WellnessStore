-- Helper function to check admin role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
-- If you add addresses, enable RLS there too (see supabase/05_addresses_checkout.sql).

-- PROFILES
create policy "profiles_admin_all"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

-- CATEGORIES
create policy "categories_public_select"
on public.categories
for select
using (true);

create policy "categories_admin_modify"
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

-- PRODUCTS
create policy "products_public_select"
on public.products
for select
using (true);

create policy "products_admin_modify"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

-- ORDERS
create policy "orders_admin_all"
on public.orders
for all
using (public.is_admin())
with check (public.is_admin());

create policy "orders_customer_select_own"
on public.orders
for select
using (user_id = auth.uid());

create policy "orders_customer_insert_own"
on public.orders
for insert
with check (user_id = auth.uid());

create policy "orders_customer_update_own"
on public.orders
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ORDER ITEMS
create policy "order_items_admin_all"
on public.order_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy "order_items_customer_select_own"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

create policy "order_items_customer_insert_own"
on public.order_items
for insert
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

-- CONTACT MESSAGES
create policy "messages_anyone_insert"
on public.contact_messages
for insert
with check (true);

create policy "messages_admin_read_delete"
on public.contact_messages
for select
using (public.is_admin());

create policy "messages_admin_delete"
on public.contact_messages
for delete
using (public.is_admin());
