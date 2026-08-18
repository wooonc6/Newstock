-- Generate codes automatically and let one manually designated user rename a class.
-- Example admin assignment from the SQL editor:
-- update public.classes
-- set admin_user_id = (select id from auth.users where lower(email) = lower('teacher@example.com'))
-- where id = '<class uuid>';

alter table public.classes
  add column admin_user_id uuid references auth.users(id) on delete set null;

alter table public.classes
  alter column class_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

create index classes_admin_user_id_idx on public.classes (admin_user_id)
  where admin_user_id is not null;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.add_class_admin_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.admin_user_id is not null then
    insert into public.class_members (class_id, user_id)
    values (new.id, new.admin_user_id)
    on conflict (class_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.add_class_admin_as_member() from public, anon, authenticated;

create trigger add_class_admin_as_member
after insert or update of admin_user_id on public.classes
for each row execute function private.add_class_admin_as_member();

drop policy if exists "members can read their classes" on public.classes;
create policy "members and admins can read their classes"
  on public.classes for select to authenticated
  using (
    admin_user_id = (select auth.uid())
    or exists (
      select 1 from public.class_members cm
      where cm.class_id = classes.id and cm.user_id = (select auth.uid())
    )
  );

create or replace function public.get_my_classes()
returns table (
  id uuid,
  name text,
  joined_at timestamptz,
  is_admin boolean,
  class_code text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, cm.joined_at,
    c.admin_user_id = (select auth.uid()) as is_admin,
    case when c.admin_user_id = (select auth.uid()) then c.class_code else null end as class_code
  from public.class_members cm
  join public.classes c on c.id = cm.class_id
  where cm.user_id = (select auth.uid())
  order by cm.joined_at, c.name;
$$;

revoke all on function public.get_my_classes() from public, anon;
grant execute on function public.get_my_classes() to authenticated;

create or replace function public.rename_managed_class(p_class_id uuid, p_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(p_name);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 100 then
    raise exception 'Invalid class name' using errcode = '22023';
  end if;

  return query
  update public.classes c
  set name = v_name
  where c.id = p_class_id and c.admin_user_id = (select auth.uid())
  returning c.id, c.name;

  if not found then
    raise exception 'Class admin required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.rename_managed_class(uuid, text) from public, anon;
grant execute on function public.rename_managed_class(uuid, text) to authenticated;
