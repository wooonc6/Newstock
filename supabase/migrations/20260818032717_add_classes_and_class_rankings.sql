-- Classes are created manually by administrators in the Supabase dashboard.
-- Students join with class_code; membership persists in class_members.

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  class_code text not null,
  created_at timestamptz not null default now(),
  constraint classes_class_code_format check (class_code = upper(trim(class_code)) and class_code ~ '^[A-Z0-9][A-Z0-9_-]{3,31}$')
);

create unique index classes_class_code_unique on public.classes (upper(class_code));

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index class_members_user_id_idx on public.class_members (user_id, joined_at);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- Do not expose class_code through the Data API, even to existing members.
revoke all on table public.classes from anon, authenticated;
grant select (id, name, created_at) on table public.classes to authenticated;
grant select on table public.class_members to authenticated;
revoke insert, update, delete on table public.classes from anon, authenticated;
revoke insert, update, delete on table public.class_members from anon, authenticated;

create policy "members can read their classes"
  on public.classes for select to authenticated
  using (
    exists (
      select 1 from public.class_members cm
      where cm.class_id = classes.id and cm.user_id = (select auth.uid())
    )
  );

create policy "members can read own memberships"
  on public.class_members for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.join_class_by_code(p_class_code text)
returns table (id uuid, name text, joined_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_class public.classes%rowtype;
  v_joined_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select c.* into v_class
  from public.classes c
  where upper(c.class_code) = upper(trim(p_class_code));

  if v_class.id is null then
    raise exception 'Invalid class code' using errcode = 'P0002';
  end if;

  insert into public.class_members (class_id, user_id)
  values (v_class.id, v_user_id)
  on conflict (class_id, user_id) do update
    set user_id = excluded.user_id
  returning class_members.joined_at into v_joined_at;

  return query select v_class.id, v_class.name, v_joined_at;
end;
$$;

revoke all on function public.join_class_by_code(text) from public, anon;
grant execute on function public.join_class_by_code(text) to authenticated;

drop function if exists public.get_learning_rankings(integer);

create function public.get_learning_rankings(p_limit integer default 500, p_class_id uuid default null)
returns table (
  id uuid,
  nickname text,
  current_coins integer,
  total_earned_coins bigint,
  realized_profit numeric,
  realized_cost_basis numeric,
  realized_return_rate numeric,
  portfolio_cost_basis numeric,
  holding_count bigint,
  holdings jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_class_id is not null and not exists (
    select 1 from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = (select auth.uid())
  ) then
    raise exception 'Class membership required' using errcode = '42501';
  end if;

  return query
  with quiz_totals as (
    select qs.user_id, coalesce(sum(qs.coins_earned), 0)::bigint as total_earned_coins
    from public.quiz_sessions qs group by qs.user_id
  ),
  trade_users as (
    select distinct t.user_id from public.trades t
  ),
  realized_totals as (
    select t.user_id, coalesce(sum(t.realized_profit), 0)::numeric as realized_profit,
      coalesce(sum(t.cost_basis), 0)::numeric as realized_cost_basis
    from public.trades t where t.trade_type = 'sell' group by t.user_id
  ),
  portfolio_totals as (
    select p.user_id,
      coalesce(sum(p.quantity * p.avg_cost) filter (where p.quantity > 0), 0)::numeric as portfolio_cost_basis,
      count(*) filter (where p.quantity > 0)::bigint as holding_count,
      coalesce(jsonb_agg(jsonb_build_object('ticker', p.ticker, 'quantity', p.quantity, 'avg_cost', p.avg_cost, 'updated_at', p.updated_at) order by p.ticker) filter (where p.quantity > 0), '[]'::jsonb) as holdings
    from public.portfolio p group by p.user_id
  )
  select u.id,
    coalesce(nullif(u.nickname, ''), nullif(split_part(u.email, '@', 1), '')) as nickname,
    coalesce(u.coins, 0)::integer,
    coalesce(q.total_earned_coins, 0)::bigint,
    coalesce(r.realized_profit, 0)::numeric,
    coalesce(r.realized_cost_basis, 0)::numeric,
    case when coalesce(r.realized_cost_basis, 0) > 0 then round((r.realized_profit / r.realized_cost_basis) * 100, 2) else 0::numeric end,
    coalesce(p.portfolio_cost_basis, 0)::numeric,
    coalesce(p.holding_count, 0)::bigint,
    coalesce(p.holdings, '[]'::jsonb)
  from public.users u
  left join quiz_totals q on q.user_id = u.id
  left join trade_users tu on tu.user_id = u.id
  left join realized_totals r on r.user_id = u.id
  left join portfolio_totals p on p.user_id = u.id
  where (p_class_id is null or exists (
      select 1 from public.class_members cm where cm.class_id = p_class_id and cm.user_id = u.id
    ))
    and (coalesce(q.total_earned_coins, 0) > 0 or tu.user_id is not null or coalesce(p.holding_count, 0) > 0)
  order by coalesce(u.coins, 0) + coalesce(p.portfolio_cost_basis, 0) desc,
    coalesce(p.holding_count, 0) desc, coalesce(q.total_earned_coins, 0) desc,
    case when coalesce(r.realized_cost_basis, 0) > 0 then r.realized_profit / r.realized_cost_basis else 0 end desc,
    u.created_at asc
  limit least(greatest(coalesce(p_limit, 500), 1), 500);
end;
$$;

revoke all on function public.get_learning_rankings(integer, uuid) from public, anon;
grant execute on function public.get_learning_rankings(integer, uuid) to authenticated;
