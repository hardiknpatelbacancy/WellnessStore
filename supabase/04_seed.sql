-- Seed users (admin + customers), categories, products, and one sample order.
-- Password for all seeded users below: Pass@12345

with seed_users as (
  select *
  from (
    values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@wellnessstore.com', 'Admin User', 'admin'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'jane@wellnessstore.com', 'Jane Carter', 'customer'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'alex@wellnessstore.com', 'Alex Morgan', 'customer'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'mia@wellnessstore.com', 'Mia Reed', 'customer')
  ) as t(id, email, full_name, role)
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  su.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  su.email,
  crypt('Pass@12345', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('full_name', su.full_name, 'role', su.role),
  now(),
  now()
from seed_users su
on conflict (id) do nothing;

-- Ensure email identity rows exist for seeded users (required for password login).
with seed_users as (
  select *
  from (
    values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@wellnessstore.com', 'Admin User', 'admin'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'jane@wellnessstore.com', 'Jane Carter', 'customer'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'alex@wellnessstore.com', 'Alex Morgan', 'customer'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'mia@wellnessstore.com', 'Mia Reed', 'customer')
  ) as t(id, email, full_name, role)
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  su.id,
  jsonb_build_object(
    'sub', su.id::text,
    'email', su.email,
    'email_verified', true
  ),
  'email',
  su.email,
  now(),
  now()
from seed_users su
where not exists (
  select 1
  from auth.identities i
  where i.user_id = su.id
    and i.provider = 'email'
);

insert into public.profiles (id, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'Jane Carter', 'customer'),
  ('33333333-3333-3333-3333-333333333333', 'Alex Morgan', 'customer'),
  ('44444444-4444-4444-4444-444444444444', 'Mia Reed', 'customer')
on conflict (id) do nothing;

insert into public.categories (id, name, description)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Herbal Supplements', 'Plant-based support for everyday health'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Organic Skincare', 'Clean skincare with natural ingredients'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Fitness Essentials', 'Performance and recovery products')
on conflict (id) do nothing;

insert into public.products (id, name, description, price, image_url, category_id)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Ashwagandha Balance', 'Adaptogenic herb capsules for stress support', 24.99, 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Turmeric + Ginger Blend', 'Daily inflammation support supplement', 19.50, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Botanical Glow Serum', 'Hydrating organic facial serum', 29.99, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'Green Tea Cleanser', 'Gentle cleanser with antioxidant botanicals', 16.75, 'https://images.unsplash.com/photo-1556228720-195a672e8a03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'Resistance Bands Set', 'Light/medium/heavy bands for home workouts', 34.00, 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'Recovery Foam Roller', 'Deep tissue foam roller for recovery', 27.25, 'https://images.unsplash.com/photo-1518611012118-696072aa579a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3')
on conflict (id) do nothing;

insert into public.orders (id, user_id, total_amount, status)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '22222222-2222-2222-2222-222222222222', 44.49, 'processing')
on conflict (id) do nothing;

insert into public.order_items (id, order_id, product_id, quantity, price)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 24.99),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 1, 19.50)
on conflict (id) do nothing;

insert into public.contact_messages (name, email, message)
values
  ('Priya', 'priya@example.com', 'Do you restock Ashwagandha every month?'),
  ('Noah', 'noah@example.com', 'Can I get recommendations for post-workout recovery?');
