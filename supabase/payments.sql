-- Payments: ad bookings, ad expiry, stored Stripe price ids. Safe to re-run.

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
