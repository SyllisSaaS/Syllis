-- Catalogue tables only — paste into the Supabase SQL editor if the rest of schema.sql is already applied.
-- Safe to re-run.

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
