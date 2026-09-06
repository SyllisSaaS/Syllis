-- Syllis appearance + brand ownership. Safe to re-run.
-- Does not touch other apps' tables.

alter table public.syllis_profiles add column if not exists avatar_url text;
alter table public.syllis_profiles add column if not exists avatar_x numeric not null default 50;
alter table public.syllis_profiles add column if not exists avatar_y numeric not null default 50;
alter table public.syllis_profiles add column if not exists bio text;

alter table public.syllis_brands add column if not exists owner_id uuid;
alter table public.syllis_brands add column if not exists avatar_url text;
alter table public.syllis_brands add column if not exists avatar_x numeric not null default 50;
alter table public.syllis_brands add column if not exists avatar_y numeric not null default 50;
alter table public.syllis_brands add column if not exists banner_mode text not null default 'color';
alter table public.syllis_brands add column if not exists banner_color text not null default '#141414';
alter table public.syllis_brands add column if not exists banner_url text;
alter table public.syllis_brands add column if not exists banner_x numeric not null default 50;
alter table public.syllis_brands add column if not exists banner_y numeric not null default 50;

alter table public.syllis_products add column if not exists owner_id uuid;
alter table public.syllis_products add column if not exists image_x numeric not null default 50;
alter table public.syllis_products add column if not exists image_y numeric not null default 50;

create index if not exists syllis_brands_owner_idx on public.syllis_brands (owner_id);
create index if not exists syllis_products_owner_idx on public.syllis_products (owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'syllis-media',
  'syllis-media',
  true,
  4194304,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "syllis media public read" on storage.objects;
create policy "syllis media public read"
on storage.objects for select
using (bucket_id = 'syllis-media');
