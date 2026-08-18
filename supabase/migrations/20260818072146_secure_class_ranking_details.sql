-- Class ranking details are visible only when both viewer and target belong
-- to the selected class. The global ranking detail functions stay unchanged.

create or replace function public.get_class_portfolio_snapshot(
  p_user_id uuid,
  p_class_id uuid
)
returns table (
  nickname text,
  current_coins integer,
  ticker text,
  quantity numeric,
  avg_cost numeric,
  updated_at timestamptz
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

  if not exists (
    select 1 from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = (select auth.uid())
  ) or not exists (
    select 1 from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = p_user_id
  ) then
    raise exception 'Class membership required' using errcode = '42501';
  end if;

  return query
  select
    coalesce(nullif(u.nickname, ''), nullif(split_part(u.email, '@', 1), '')),
    coalesce(u.coins, 0)::integer,
    p.ticker,
    p.quantity,
    p.avg_cost,
    p.updated_at
  from public.users u
  left join public.portfolio p on p.user_id = u.id and p.quantity > 0
  where u.id = p_user_id
  order by p.updated_at desc nulls last, p.ticker;
end;
$$;

revoke all on function public.get_class_portfolio_snapshot(uuid, uuid) from public, anon;
grant execute on function public.get_class_portfolio_snapshot(uuid, uuid) to authenticated;

create or replace function public.get_class_trade_history(
  p_user_id uuid,
  p_class_id uuid,
  p_limit integer default null
)
returns table (
  id uuid,
  ticker text,
  trade_type text,
  quantity numeric,
  price numeric,
  coins_delta numeric,
  cost_basis numeric,
  realized_profit numeric,
  traded_at timestamptz
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

  if not exists (
    select 1 from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = (select auth.uid())
  ) or not exists (
    select 1 from public.class_members cm
    where cm.class_id = p_class_id and cm.user_id = p_user_id
  ) then
    raise exception 'Class membership required' using errcode = '42501';
  end if;

  return query
  select t.id, t.ticker, t.trade_type, t.quantity, t.price, t.coins_delta,
    t.cost_basis, t.realized_profit, t.traded_at
  from public.trades t
  where t.user_id = p_user_id
  order by t.traded_at desc
  limit case when p_limit is null then null else least(greatest(p_limit, 1), 1000) end;
end;
$$;

revoke all on function public.get_class_trade_history(uuid, uuid, integer) from public, anon;
grant execute on function public.get_class_trade_history(uuid, uuid, integer) to authenticated;
