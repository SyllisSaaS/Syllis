-- Syllis schema — paste into the Supabase SQL editor (safe to re-run)
-- Tables are named syllis_* so they do not touch other apps in the same database.
-- Auth users stay in auth.users; Syllis profiles live in public.syllis_profiles.

create extension if not exists pgcrypto;

create table if not exists public.syllis_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  name text,
  username text,
  role text not null default 'shopper'
    check (role in ('shopper', 'brand', 'stylist', 'admin')),
  plan text not null default 'free'
    check (plan in ('free', 'early', 'starter', 'growth', 'premium')),
  look text,
  brand_slug text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  trial_ends_at timestamptz,
  verification_status text not null default 'unverified',
  founding_brand boolean not null default false,
  founding_member boolean not null default false,
  founding_started_at timestamptz,
  brand_status text not null default 'pending',
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.syllis_profiles add column if not exists email text;
alter table public.syllis_profiles add column if not exists full_name text;
alter table public.syllis_profiles add column if not exists name text;
alter table public.syllis_profiles add column if not exists username text;
alter table public.syllis_profiles add column if not exists role text;
alter table public.syllis_profiles add column if not exists plan text;
alter table public.syllis_profiles add column if not exists look text;
alter table public.syllis_profiles add column if not exists brand_slug text;
alter table public.syllis_profiles add column if not exists stripe_customer_id text;
alter table public.syllis_profiles add column if not exists stripe_subscription_id text;
alter table public.syllis_profiles add column if not exists subscription_status text;
alter table public.syllis_profiles add column if not exists trial_ends_at timestamptz;
alter table public.syllis_profiles add column if not exists verification_status text;
alter table public.syllis_profiles add column if not exists founding_brand boolean;
alter table public.syllis_profiles add column if not exists founding_member boolean;
alter table public.syllis_profiles add column if not exists founding_started_at timestamptz;
alter table public.syllis_profiles add column if not exists brand_status text;
alter table public.syllis_profiles add column if not exists terms_accepted_at timestamptz;
alter table public.syllis_profiles add column if not exists privacy_accepted_at timestamptz;

create table if not exists public.syllis_saved_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.syllis_analytics_events (
  id bigint generated always as identity primary key,
  name text not null,
  path text,
  product_id text,
  brand_slug text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.syllis_reservations (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  size text,
  pool text not null check (pool in ('early', 'public')),
  status text not null default 'held' check (status in ('held', 'expired', 'released')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.syllis_analytics_layouts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  widgets jsonb not null default '[]'::jsonb,
  chart_type text not null default 'bar',
  updated_at timestamptz not null default now()
);

create table if not exists public.syllis_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('brand', 'stylist')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.syllis_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_type text not null check (target_type in ('brand', 'user', 'product', 'stylist', 'drop')),
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.syllis_ledger (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('subscription', 'stylist_cut', 'ad', 'other')),
  amount_pence integer not null,
  currency text not null default 'gbp',
  description text,
  user_id uuid references auth.users (id) on delete set null,
  stripe_id text,
  occurred_at timestamptz not null default now()
);

create unique index if not exists syllis_ledger_stripe_id_uidx
  on public.syllis_ledger (stripe_id)
  where stripe_id is not null;

create table if not exists public.syllis_stylist_payouts (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references auth.users (id) on delete cascade,
  gross_pence integer not null,
  platform_cut_pence integer not null,
  net_pence integer not null,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.syllis_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.syllis_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.syllis_profiles enable row level security;
alter table public.syllis_saved_items enable row level security;
alter table public.syllis_analytics_events enable row level security;
alter table public.syllis_reservations enable row level security;
alter table public.syllis_analytics_layouts enable row level security;
alter table public.syllis_applications enable row level security;
alter table public.syllis_reports enable row level security;
alter table public.syllis_ledger enable row level security;
alter table public.syllis_stylist_payouts enable row level security;

drop policy if exists "syllis profiles self" on public.syllis_profiles;
create policy "syllis profiles self" on public.syllis_profiles
  for select using (auth.uid() = id or public.syllis_is_admin());

drop policy if exists "syllis profiles insert" on public.syllis_profiles;
create policy "syllis profiles insert" on public.syllis_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "syllis profiles update" on public.syllis_profiles;
create policy "syllis profiles update" on public.syllis_profiles
  for update using (auth.uid() = id or public.syllis_is_admin())
  with check (auth.uid() = id or public.syllis_is_admin());

drop policy if exists "syllis saved self" on public.syllis_saved_items;
create policy "syllis saved self" on public.syllis_saved_items
  for all using (auth.uid() = user_id or public.syllis_is_admin())
  with check (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis events insert" on public.syllis_analytics_events;
create policy "syllis events insert" on public.syllis_analytics_events
  for insert with check (true);

drop policy if exists "syllis events read" on public.syllis_analytics_events;
create policy "syllis events read" on public.syllis_analytics_events
  for select using (
    public.syllis_is_admin()
    or user_id = auth.uid()
    or brand_slug in (select brand_slug from public.syllis_profiles where id = auth.uid())
  );

drop policy if exists "syllis reservations self" on public.syllis_reservations;
create policy "syllis reservations self" on public.syllis_reservations
  for all using (auth.uid() = user_id or public.syllis_is_admin())
  with check (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis layouts self" on public.syllis_analytics_layouts;
create policy "syllis layouts self" on public.syllis_analytics_layouts
  for all using (auth.uid() = user_id or public.syllis_is_admin())
  with check (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis applications self" on public.syllis_applications;
create policy "syllis applications self" on public.syllis_applications
  for select using (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis applications insert" on public.syllis_applications;
create policy "syllis applications insert" on public.syllis_applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "syllis applications admin" on public.syllis_applications;
create policy "syllis applications admin" on public.syllis_applications
  for update using (public.syllis_is_admin());

drop policy if exists "syllis reports insert" on public.syllis_reports;
create policy "syllis reports insert" on public.syllis_reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "syllis reports read" on public.syllis_reports;
create policy "syllis reports read" on public.syllis_reports
  for select using (auth.uid() = reporter_id or public.syllis_is_admin());

drop policy if exists "syllis reports admin" on public.syllis_reports;
create policy "syllis reports admin" on public.syllis_reports
  for update using (public.syllis_is_admin());

drop policy if exists "syllis ledger admin" on public.syllis_ledger;
create policy "syllis ledger admin" on public.syllis_ledger
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

drop policy if exists "syllis payouts read" on public.syllis_stylist_payouts;
create policy "syllis payouts read" on public.syllis_stylist_payouts
  for select using (auth.uid() = stylist_id or public.syllis_is_admin());

drop policy if exists "syllis payouts write" on public.syllis_stylist_payouts;
create policy "syllis payouts write" on public.syllis_stylist_payouts
  for insert with check (public.syllis_is_admin());

-- Catalogue (admin-controlled public listings)
create table if not exists public.syllis_brands (
  id text primary key,
  slug text not null unique,
  name text not null,
  niche text not null default '',
  location text not null default '',
  description text not null default '',
  image text not null default '',
  featured boolean not null default false,
  live boolean not null default true,
  source text not null default 'real' check (source in ('demo', 'seed', 'real')),
  created_at timestamptz not null default now()
);

create table if not exists public.syllis_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  brand_id text references public.syllis_brands (id) on delete cascade,
  brand_slug text,
  label text not null,
  price numeric not null,
  category text not null default 'Apparel',
  style text not null default 'Minimal',
  badge text,
  image text not null default '',
  description text not null default '',
  retailer text not null default '',
  featured boolean not null default false,
  stock integer,
  live boolean not null default true,
  source text not null default 'real' check (source in ('demo', 'seed', 'real')),
  created_at timestamptz not null default now()
);

create table if not exists public.syllis_ads (
  id text primary key,
  title text not null,
  brand text not null,
  image text not null default '',
  placement text not null default 'All',
  days integer not null default 3,
  base_price integer not null default 100,
  live boolean not null default true,
  source text not null default 'real' check (source in ('demo', 'seed', 'real')),
  created_at timestamptz not null default now()
);

create index if not exists syllis_brands_live_idx on public.syllis_brands (live);
create index if not exists syllis_products_live_idx on public.syllis_products (live);
create index if not exists syllis_products_style_idx on public.syllis_products (style);
create index if not exists syllis_ads_live_idx on public.syllis_ads (live);

alter table public.syllis_brands enable row level security;
alter table public.syllis_products enable row level security;
alter table public.syllis_ads enable row level security;

drop policy if exists "syllis brands public" on public.syllis_brands;
create policy "syllis brands public" on public.syllis_brands
  for select using (live = true or public.syllis_is_admin());

drop policy if exists "syllis brands admin" on public.syllis_brands;
create policy "syllis brands admin" on public.syllis_brands
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

drop policy if exists "syllis products public" on public.syllis_products;
create policy "syllis products public" on public.syllis_products
  for select using (live = true or public.syllis_is_admin());

drop policy if exists "syllis products admin" on public.syllis_products;
create policy "syllis products admin" on public.syllis_products
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

drop policy if exists "syllis ads public" on public.syllis_ads;
create policy "syllis ads public" on public.syllis_ads
  for select using (live = true or public.syllis_is_admin());

drop policy if exists "syllis ads admin" on public.syllis_ads;
create policy "syllis ads admin" on public.syllis_ads
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

-- Analytics hide/restore (admin). Safe to re-run.
alter table public.syllis_analytics_events
  add column if not exists archive_batch_id uuid;

create index if not exists syllis_analytics_events_live_idx
  on public.syllis_analytics_events (created_at)
  where archive_batch_id is null;

create table if not exists public.syllis_analytics_resets (
  id uuid primary key default gen_random_uuid(),
  from_at timestamptz not null,
  to_at timestamptz not null,
  event_count integer not null default 0,
  created_at timestamptz not null default now(),
  restored_at timestamptz
);

alter table public.syllis_analytics_resets enable row level security;

drop policy if exists "syllis events admin update" on public.syllis_analytics_events;
create policy "syllis events admin update" on public.syllis_analytics_events
  for update using (public.syllis_is_admin());

drop policy if exists "syllis resets admin" on public.syllis_analytics_resets;
create policy "syllis resets admin" on public.syllis_analytics_resets
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

alter table public.syllis_ads
  add column if not exists product_slug text,
  add column if not exists ends_at timestamptz,
  add column if not exists booking_id uuid,
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create table if not exists public.syllis_ad_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  placement text not null,
  days integer not null check (days in (3, 7)),
  amount_pence integer not null,
  renewals integer not null default 0,
  title text not null,
  brand text not null default '',
  image text not null default '',
  product_slug text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'live', 'ended', 'refunded')),
  stripe_session_id text unique,
  ad_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists syllis_ad_bookings_user_idx on public.syllis_ad_bookings (user_id);
create index if not exists syllis_ad_bookings_status_idx on public.syllis_ad_bookings (status);

create table if not exists public.syllis_stripe_prices (
  plan text primary key,
  price_id text not null,
  product_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.syllis_ad_bookings enable row level security;
alter table public.syllis_stripe_prices enable row level security;

drop policy if exists "syllis bookings self" on public.syllis_ad_bookings;
create policy "syllis bookings self" on public.syllis_ad_bookings
  for select using (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis bookings insert" on public.syllis_ad_bookings;
create policy "syllis bookings insert" on public.syllis_ad_bookings
  for insert with check (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis bookings admin" on public.syllis_ad_bookings;
create policy "syllis bookings admin" on public.syllis_ad_bookings
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

drop policy if exists "syllis stripe prices admin" on public.syllis_stripe_prices;
create policy "syllis stripe prices admin" on public.syllis_stripe_prices
  for all using (public.syllis_is_admin()) with check (public.syllis_is_admin());

drop policy if exists "syllis bookings update self" on public.syllis_ad_bookings;
create policy "syllis bookings update self" on public.syllis_ad_bookings
  for update using (auth.uid() = user_id or public.syllis_is_admin())
  with check (auth.uid() = user_id or public.syllis_is_admin());

drop policy if exists "syllis stripe prices read" on public.syllis_stripe_prices;
create policy "syllis stripe prices read" on public.syllis_stripe_prices
  for select using (true);
