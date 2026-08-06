-- 2026-08-05: expose limited paper-trade history for ranking portfolio previews.

create index if not exists trades_user_traded_at_idx
  on public.trades (user_id, traded_at desc);

create or replace function public.get_public_trade_history(
  p_user_id uuid,
  p_limit integer default 30
)
returns table (
  id uuid,
  ticker text,
  trade_type text,
  quantity numeric,
  price numeric,
  coins_delta integer,
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

  return query
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
  from public.trades as t
  where t.user_id = p_user_id
  order by t.traded_at desc nulls last, t.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;

revoke all on function public.get_public_trade_history(uuid, integer) from public, anon;
grant execute on function public.get_public_trade_history(uuid, integer) to authenticated;