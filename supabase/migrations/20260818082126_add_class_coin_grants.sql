-- Audited, administrator-only grants to every student currently in a class.

create table public.class_coin_grants (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  amount integer not null check (amount between 1 and 100000000),
  granted_by uuid not null references auth.users(id) on delete restrict,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  created_at timestamptz not null default now()
);

create table public.class_coin_grant_recipients (
  grant_id uuid not null references public.class_coin_grants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  balance_after integer not null,
  primary key (grant_id, user_id)
);

create index class_coin_grants_class_created_idx
  on public.class_coin_grants (class_id, created_at desc);

alter table public.class_coin_grants enable row level security;
alter table public.class_coin_grant_recipients enable row level security;
revoke all on table public.class_coin_grants from public, anon, authenticated;
revoke all on table public.class_coin_grant_recipients from public, anon, authenticated;

create or replace function public.grant_class_coins(p_class_id uuid, p_amount integer)
returns table (grant_id uuid, amount integer, recipient_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_grant_id uuid;
  v_recipient_count integer;
begin
  if v_admin_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000000 then
    raise exception 'Grant amount must be between 1 and 100000000' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.admin_user_id = v_admin_id
  ) then
    raise exception 'Class admin required' using errcode = '42501';
  end if;
  if exists (
    select 1
    from public.users u
    join public.class_members cm on cm.user_id = u.id
    where cm.class_id = p_class_id
      and cm.user_id <> v_admin_id
      and coalesce(u.coins, 0) > 2147483647 - p_amount
  ) then
    raise exception 'A recipient balance would exceed the supported maximum' using errcode = '22003';
  end if;

  insert into public.class_coin_grants (class_id, amount, granted_by)
  values (p_class_id, p_amount, v_admin_id)
  returning id into v_grant_id;

  with updated as (
    update public.users u
    set coins = coalesce(u.coins, 0) + p_amount
    from public.class_members cm
    where cm.class_id = p_class_id
      and cm.user_id = u.id
      and cm.user_id <> v_admin_id
    returning u.id, u.coins
  )
  insert into public.class_coin_grant_recipients (grant_id, user_id, balance_after)
  select v_grant_id, updated.id, updated.coins from updated;

  get diagnostics v_recipient_count = row_count;
  if v_recipient_count = 0 then
    raise exception 'No students in class' using errcode = 'P0002';
  end if;

  update public.class_coin_grants
  set recipient_count = v_recipient_count
  where id = v_grant_id;

  return query select v_grant_id, p_amount, v_recipient_count;
end;
$$;

revoke all on function public.grant_class_coins(uuid, integer) from public, anon;
grant execute on function public.grant_class_coins(uuid, integer) to authenticated;
