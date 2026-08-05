-- 2026-08-05: expose ranking ingredients for the learning-investment score.
-- Live market prices are calculated in Next.js because Postgres should not call Yahoo Finance.

drop function if exists public.get_learning_rankings(integer);

create function public.get_learning_rankings(p_limit integer default 100)
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

  return query
  with quiz_totals as (
    select qs.user_id, coalesce(sum(qs.coins_earned), 0)::bigint as total_earned_coins
    from public.quiz_sessions as qs
    group by qs.user_id
  ),
  trade_users as (
    select distinct t.user_id
    from public.trades as t
  ),
  realized_totals as (
    select
      t.user_id,
      coalesce(sum(t.realized_profit), 0)::numeric as realized_profit,
      coalesce(sum(t.cost_basis), 0)::numeric as realized_cost_basis
    from public.trades as t
    where t.trade_type = 'sell'
    group by t.user_id
  ),
  portfolio_totals as (
    select
      p.user_id,
      coalesce(sum(p.quantity * p.avg_cost), 0)::numeric as portfolio_cost_basis,
      count(*) filter (where p.quantity > 0)::bigint as holding_count,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'ticker', p.ticker,
            'quantity', p.quantity,
            'avg_cost', p.avg_cost
          )
          order by p.ticker
        ) filter (where p.quantity > 0),
        '[]'::jsonb
      ) as holdings
    from public.portfolio as p
    group by p.user_id
  )
  select
    u.id,
    coalesce(nullif(u.nickname, ''), nullif(split_part(u.email, '@', 1), '')) as nickname,
    coalesce(u.coins, 0)::integer,
    coalesce(q.total_earned_coins, 0)::bigint,
    coalesce(r.realized_profit, 0)::numeric,
    coalesce(r.realized_cost_basis, 0)::numeric,
    case
      when coalesce(r.realized_cost_basis, 0) > 0
        then round((r.realized_profit / r.realized_cost_basis) * 100, 2)
      else 0::numeric
    end as realized_return_rate,
    coalesce(p.portfolio_cost_basis, 0)::numeric,
    coalesce(p.holding_count, 0)::bigint,
    coalesce(p.holdings, '[]'::jsonb)
  from public.users as u
  left join quiz_totals as q on q.user_id = u.id
  left join trade_users as tu on tu.user_id = u.id
  left join realized_totals as r on r.user_id = u.id
  left join portfolio_totals as p on p.user_id = u.id
  where coalesce(q.total_earned_coins, 0) > 0
     or tu.user_id is not null
     or coalesce(p.holding_count, 0) > 0
  order by
    coalesce(u.coins, 0) + coalesce(p.portfolio_cost_basis, 0) desc,
    coalesce(q.total_earned_coins, 0) desc,
    case when coalesce(r.realized_cost_basis, 0) > 0 then r.realized_profit / r.realized_cost_basis else 0 end desc,
    u.created_at asc
  limit least(greatest(coalesce(p_limit, 100), 1), 100);
end;
$$;

revoke all on function public.get_learning_rankings(integer) from public, anon;
grant execute on function public.get_learning_rankings(integer) to authenticated;
