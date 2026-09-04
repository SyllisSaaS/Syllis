-- Hide-and-restore for admin analytics. Safe to re-run.
-- Does not touch income, accounts, or the catalogue.

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
