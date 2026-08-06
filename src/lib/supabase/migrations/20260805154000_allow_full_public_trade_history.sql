create or replace function public.get_public_trade_history(
  p_user_id uuid,
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
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    t.ticker,
    t.trade_type,
    t.quantity,
    t.price,
    t.coins_delta,
    t.cost_basis,
    t.realized_profit,
    t.traded_at
  from public.trades t
  where t.user_id = p_user_id
  order by t.traded_at desc
  limit case
    when p_limit is null then null
    else least(greatest(p_limit, 1), 1000)
  end;
$$;

revoke all on function public.get_public_trade_history(uuid, integer) from public, anon;
grant execute on function public.get_public_trade_history(uuid, integer) to authenticated;
