-- 2026-08-04 14:19:53 KST
-- Rank users by cumulative quiz rewards, with realized return as the tie-breaker.
-- Unrealized gains and losses are intentionally excluded until shares are sold.

alter table public.trades
  add column if not exists cost_basis numeric,
  add column if not exists realized_profit numeric;

comment on column public.trades.cost_basis is
  'Average acquisition cost of the shares in a sell transaction. Null for buys.';
comment on column public.trades.realized_profit is
  'Sale proceeds minus cost basis. Null for buys.';

-- Reconstruct cost basis for existing sell records by replaying each user/ticker
-- position in chronological order with the same weighted-average rule as the app.
do $$
declare
  v_trade record;
  v_quantity numeric;
  v_avg_cost numeric;
  v_matched_quantity numeric;
  v_cost_basis numeric;
begin
  create temporary table ranking_position_replay (
    user_id uuid not null,
    ticker text not null,
    quantity numeric not null default 0,
    avg_cost numeric not null default 0,
    primary key (user_id, ticker)
  ) on commit drop;

  for v_trade in
    select id, user_id, ticker, trade_type, quantity, price
    from public.trades
    order by user_id, ticker, traded_at, id
  loop
    select quantity, avg_cost
    into v_quantity, v_avg_cost
    from ranking_position_replay
    where user_id = v_trade.user_id
      and ticker = v_trade.ticker;

    v_quantity := coalesce(v_quantity, 0);
    v_avg_cost := coalesce(v_avg_cost, 0);

    if v_trade.trade_type = 'buy' then
      insert into ranking_position_replay (user_id, ticker, quantity, avg_cost)
      values (
        v_trade.user_id,
        v_trade.ticker,
        coalesce(v_trade.quantity, 0),
        coalesce(v_trade.price, 0)
      )
      on conflict (user_id, ticker) do update set
        avg_cost = case
          when ranking_position_replay.quantity + excluded.quantity > 0 then
            (
              ranking_position_replay.quantity * ranking_position_replay.avg_cost
              + excluded.quantity * excluded.avg_cost
            ) / (ranking_position_replay.quantity + excluded.quantity)
          else 0
        end,
        quantity = ranking_position_replay.quantity + excluded.quantity;
    elsif v_trade.trade_type = 'sell' then
      v_matched_quantity := least(coalesce(v_trade.quantity, 0), v_quantity);
      v_cost_basis := v_matched_quantity * v_avg_cost;

      update public.trades
      set
        cost_basis = v_cost_basis,
        realized_profit = coalesce(v_trade.price, 0) * v_matched_quantity - v_cost_basis
      where id = v_trade.id
        and cost_basis is null;

      update ranking_position_replay
      set quantity = greatest(quantity - v_matched_quantity, 0)
      where user_id = v_trade.user_id
        and ticker = v_trade.ticker;
    end if;
  end loop;
end;
$$;

create or replace function public.get_learning_rankings(p_limit integer default 50)
returns table (
  id uuid,
  nickname text,
  total_earned_coins bigint,
  realized_profit numeric,
  realized_cost_basis numeric,
  realized_return_rate numeric
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
  with quiz_totals as (
    select
      qs.user_id,
      coalesce(sum(qs.coins_earned), 0)::bigint as total_earned_coins
    from public.quiz_sessions as qs
    group by qs.user_id
  ),
  realized_totals as (
    select
      t.user_id,
      coalesce(sum(t.realized_profit), 0)::numeric as realized_profit,
      coalesce(sum(t.cost_basis), 0)::numeric as realized_cost_basis
    from public.trades as t
    where t.trade_type = 'sell'
    group by t.user_id
  )
  select
    u.id,
    u.nickname,
    coalesce(q.total_earned_coins, 0)::bigint,
    coalesce(r.realized_profit, 0)::numeric,
    coalesce(r.realized_cost_basis, 0)::numeric,
    case
      when coalesce(r.realized_cost_basis, 0) > 0 then
        round((r.realized_profit / r.realized_cost_basis) * 100, 2)
      else 0::numeric
    end as realized_return_rate
  from public.users as u
  left join quiz_totals as q on q.user_id = u.id
  left join realized_totals as r on r.user_id = u.id
  order by
    coalesce(q.total_earned_coins, 0) desc,
    case
      when coalesce(r.realized_cost_basis, 0) > 0 then
        r.realized_profit / r.realized_cost_basis
      else 0
    end desc,
    u.created_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

revoke all on function public.get_learning_rankings(integer) from public, anon;
grant execute on function public.get_learning_rankings(integer) to authenticated;
