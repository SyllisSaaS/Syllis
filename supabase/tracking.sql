-- Verified tracking. Safe to re-run after orders.sql.
-- Paste into the Supabase SQL editor.

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
