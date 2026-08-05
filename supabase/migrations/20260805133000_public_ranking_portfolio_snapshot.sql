-- 2026-08-05: let signed-in learners inspect a ranked user's public simulation snapshot.
-- The snapshot intentionally contains only display name, virtual cash, and holdings.

drop function if exists public.get_learning_rankings(integer);

create function public.get_learning_rankings(p_limit integer default 50)
returns table (
  id uuid,
  nickname text,
  current_coins integer,
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
    select qs.user_id, coalesce(sum(qs.coins_earned), 0)::bigint as total_earned_coins
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
    coalesce(u.coins, 0)::integer,
    coalesce(q.total_earned_coins, 0)::bigint,
    coalesce(r.realized_profit, 0)::numeric,
    coalesce(r.realized_cost_basis, 0)::numeric,
    case
      when coalesce(r.realized_cost_basis, 0) > 0
        then round((r.realized_profit / r.realized_cost_basis) * 100, 2)
      else 0::numeric
    end
  from public.users as u
  left join quiz_totals as q on q.user_id = u.id
  left join realized_totals as r on r.user_id = u.id
  order by
    coalesce(q.total_earned_coins, 0) desc,
    case when coalesce(r.realized_cost_basis, 0) > 0 then r.realized_profit / r.realized_cost_basis else 0 end desc,
    u.created_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

revoke all on function public.get_learning_rankings(integer) from public, anon;
grant execute on function public.get_learning_rankings(integer) to authenticated;

create or replace function public.get_public_portfolio_snapshot(p_user_id uuid)
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

  return query
  select
    u.nickname,
    coalesce(u.coins, 0)::integer,
    p.ticker,
    p.quantity,
    p.avg_cost,
    p.updated_at
  from public.users as u
  left join public.portfolio as p on p.user_id = u.id
  where u.id = p_user_id
  order by p.updated_at desc nulls last, p.ticker asc;
end;
$$;

revoke all on function public.get_public_portfolio_snapshot(uuid) from public, anon;
grant execute on function public.get_public_portfolio_snapshot(uuid) to authenticated;
