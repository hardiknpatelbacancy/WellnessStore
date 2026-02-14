# WellnessStore (Next.js 14 + Supabase)

Wellness ecommerce app (no payments): products, categories, basket->order, contact messages, and an admin panel.

## Setup

1. Install deps:
   - `npm install`
2. Create `.env.local` from `.env.example` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Run:
   - `npm run dev`

## Admin

- Login via `/auth`, then open `/admin`.
- Create more admin users at `/admin/users`.

