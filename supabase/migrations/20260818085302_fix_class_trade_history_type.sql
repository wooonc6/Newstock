-- PL/pgSQL RETURN QUERY requires exact result types. trades.coins_delta is
-- integer while this public snapshot contract returns numeric.
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
  select
    t.id,
    t.ticker,
    t.trade_type,
    t.quantity,
    t.price,
    t.coins_delta::numeric,
    t.cost_basis,
    t.realized_profit,
    t.traded_at
  from public.trades t
  where t.user_id = p_user_id
  order by t.traded_at desc
  limit case when p_limit is null then null else least(greatest(p_limit, 1), 1000) end;
end;
$$;

revoke all on function public.get_class_trade_history(uuid, uuid, integer) from public, anon;
grant execute on function public.get_class_trade_history(uuid, uuid, integer) to authenticated;
