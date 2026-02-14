-- WARNING: Run in Supabase SQL Editor for this project only.
-- Drops all custom app tables and helper functions.

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
