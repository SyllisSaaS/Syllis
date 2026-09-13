-- Syllis orders + Stripe Connect columns. Safe to re-run.
-- Paste into the Supabase SQL editor after schema.sql / appearance.sql.

alter table public.syllis_brands
  add column if not exists stripe_connect_id text,
  add column if not exists payouts_ready boolean not null default false;

create unique index if not exists syllis_brands_stripe_connect_uidx
  on public.syllis_brands (stripe_connect_id)
  where stripe_connect_id is not null;

create table if not exists public.syllis_orders (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  product_slug text,
  product_name text not null,
  brand_id text,
  brand_slug text,
  brand_user_id uuid references auth.users (id) on delete set null,
  buyer_user_id uuid references auth.users (id) on delete set null,
  buyer_email text,
  amount_pence integer not null,
  platform_fee_pence integer not null,
  brand_pence integer not null,
  take_rate numeric not null,
  currency text not null default 'gbp',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'transferred', 'refunded', 'disputed', 'cancelled')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_transfer_id text,
  shipping jsonb,
  tracking_number text,
  shipped_at timestamptz,
  transferred_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists syllis_orders_brand_user_idx on public.syllis_orders (brand_user_id);
create index if not exists syllis_orders_status_idx on public.syllis_orders (status);
create index if not exists syllis_orders_charge_idx on public.syllis_orders (stripe_charge_id);

alter table public.syllis_orders enable row level security;

drop policy if exists "syllis orders brand read" on public.syllis_orders;
create policy "syllis orders brand read" on public.syllis_orders
  for select using (
    auth.uid() = brand_user_id
    or auth.uid() = buyer_user_id
    or public.syllis_is_admin()
  );

drop policy if exists "syllis orders admin" on public.syllis_orders;
create policy "syllis orders admin" on public.syllis_orders
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

-- Verified tracking. Same as supabase/tracking.sql.
alter table public.syllis_orders
  add column if not exists track_token text,
  add column if not exists tracking_carrier text,
  add column if not exists tracking_status text not null default 'none',
  add column if not exists tracking_verified_at timestamptz,
  add column if not exists tracking_last_checked_at timestamptz,
  add column if not exists tracking_events jsonb not null default '[]'::jsonb,
  add column if not exists tracking_url text,
  add column if not exists tracking_provider_id text,
  add column if not exists buyer_confirmed_at timestamptz,
  add column if not exists ship_by timestamptz;

update public.syllis_orders
  set track_token = gen_random_uuid()::text
  where track_token is null;

update public.syllis_orders
  set ship_by = created_at + interval '14 days'
  where ship_by is null
    and status in ('pending', 'paid', 'shipped');

create unique index if not exists syllis_orders_track_token_uidx
  on public.syllis_orders (track_token);

alter table public.syllis_orders
  alter column track_token set default gen_random_uuid()::text;

create table if not exists public.syllis_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.syllis_settings enable row level security;
