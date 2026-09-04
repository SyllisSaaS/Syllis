-- Paste this whole file into Supabase → SQL editor → Run.
-- Do NOT drop other tables. This only stops old auth triggers from blocking signup.

do $$
declare
  r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  exception when others then
    null;
  end;

  begin
    insert into public.syllis_profiles (id, email, full_name, role, plan, verification_status)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      case
        when lower(coalesce(new.email, '')) = 'oliverday015@gmail.com' then 'admin'
        when coalesce(new.raw_user_meta_data->>'role', '') in ('brand', 'stylist', 'shopper')
          then new.raw_user_meta_data->>'role'
        else 'shopper'
      end,
      'free',
      'unverified'
    )
    on conflict (id) do nothing;
  exception when others then
    null;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
