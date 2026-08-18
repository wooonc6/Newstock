-- Explicit developer accounts can manage every class without replacing its teacher/admin.

create table public.app_developers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_developers enable row level security;
grant select on table public.app_developers to authenticated;
revoke insert, update, delete on table public.app_developers from public, anon, authenticated;
create policy "developers can read own role"
  on public.app_developers for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.add_developer_to_all_classes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.class_members (class_id, user_id)
  select c.id, new.user_id from public.classes c
  on conflict (class_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_developer_to_all_classes() from public, anon, authenticated;
create trigger add_developer_to_all_classes
after insert on public.app_developers
for each row execute function private.add_developer_to_all_classes();

create or replace function private.add_developers_to_new_class()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.class_members (class_id, user_id)
  select new.id, d.user_id from public.app_developers d
  on conflict (class_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_developers_to_new_class() from public, anon, authenticated;
create trigger add_developers_to_new_class
after insert on public.classes
for each row execute function private.add_developers_to_new_class();

insert into public.app_developers (user_id)
select au.id from auth.users au where lower(au.email) = 'demo@newstock.com'
on conflict (user_id) do nothing;

drop policy if exists "members and admins can read their classes" on public.classes;
create policy "members admins and developers can read their classes"
  on public.classes for select to authenticated
  using (
    admin_user_id = (select auth.uid())
    or exists (select 1 from public.class_members cm where cm.class_id = classes.id and cm.user_id = (select auth.uid()))
    or exists (select 1 from public.app_developers d where d.user_id = (select auth.uid()))
  );

create or replace function public.get_my_classes()
returns table (id uuid, name text, joined_at timestamptz, is_admin boolean, class_code text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name, coalesce(cm.joined_at, c.created_at),
    (c.admin_user_id = (select auth.uid()) or d.user_id is not null),
    case when c.admin_user_id = (select auth.uid()) or d.user_id is not null then c.class_code else null end
  from public.classes c
  left join public.class_members cm on cm.class_id = c.id and cm.user_id = (select auth.uid())
  left join public.app_developers d on d.user_id = (select auth.uid())
  where cm.user_id is not null or d.user_id is not null
  order by coalesce(cm.joined_at, c.created_at), c.name;
$$;
revoke all on function public.get_my_classes() from public, anon;
grant execute on function public.get_my_classes() to authenticated;

create or replace function public.rename_managed_class(p_class_id uuid, p_name text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = '' as $$
declare v_name text := trim(p_name);
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 100 then raise exception 'Invalid class name' using errcode = '22023'; end if;
  return query update public.classes c set name = v_name
    where c.id = p_class_id and (
      c.admin_user_id = (select auth.uid())
      or exists (select 1 from public.app_developers d where d.user_id = (select auth.uid()))
    ) returning c.id, c.name;
  if not found then raise exception 'Class admin required' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.rename_managed_class(uuid, text) from public, anon;
grant execute on function public.rename_managed_class(uuid, text) to authenticated;

create or replace function public.grant_class_coins(p_class_id uuid, p_amount integer)
returns table (grant_id uuid, amount integer, recipient_count integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_grant_id uuid;
  v_recipient_count integer;
begin
  if v_actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000000 then raise exception 'Grant amount must be between 1 and 100000000' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.classes c where c.id = p_class_id and (
      c.admin_user_id = v_actor_id or exists (select 1 from public.app_developers d where d.user_id = v_actor_id)
    )
  ) then raise exception 'Class admin required' using errcode = '42501'; end if;
  if exists (
    select 1 from public.users u join public.class_members cm on cm.user_id = u.id
    where cm.class_id = p_class_id
      and not exists (select 1 from public.classes c where c.id = p_class_id and c.admin_user_id = cm.user_id)
      and not exists (select 1 from public.app_developers d where d.user_id = cm.user_id)
      and coalesce(u.coins, 0) > 2147483647 - p_amount
  ) then raise exception 'A recipient balance would exceed the supported maximum' using errcode = '22003'; end if;

  insert into public.class_coin_grants (class_id, amount, granted_by)
  values (p_class_id, p_amount, v_actor_id) returning id into v_grant_id;
  with updated as (
    update public.users u set coins = coalesce(u.coins, 0) + p_amount
    from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = u.id
      and not exists (select 1 from public.classes c where c.id = p_class_id and c.admin_user_id = cm.user_id)
      and not exists (select 1 from public.app_developers d where d.user_id = cm.user_id)
    returning u.id, u.coins
  )
  insert into public.class_coin_grant_recipients (grant_id, user_id, balance_after)
  select v_grant_id, updated.id, updated.coins from updated;
  get diagnostics v_recipient_count = row_count;
  if v_recipient_count = 0 then raise exception 'No students in class' using errcode = 'P0002'; end if;
  update public.class_coin_grants set recipient_count = v_recipient_count where id = v_grant_id;
  return query select v_grant_id, p_amount, v_recipient_count;
end;
$$;
revoke all on function public.grant_class_coins(uuid, integer) from public, anon;
grant execute on function public.grant_class_coins(uuid, integer) to authenticated;
