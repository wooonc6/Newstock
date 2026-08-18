-- Class rankings include every member immediately, even before their first
-- quiz, trade, or holding. Global rankings keep the existing activity gate.
create or replace function public.get_learning_rankings(p_limit integer default 500, p_class_id uuid default null)
returns table (
  id uuid, nickname text, current_coins integer, total_earned_coins bigint,
  realized_profit numeric, realized_cost_basis numeric, realized_return_rate numeric,
  portfolio_cost_basis numeric, holding_count bigint, holdings jsonb
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
    select qs.user_id, coalesce(sum(qs.coins_earned), 0)::bigint total_earned_coins
    from public.quiz_sessions qs
    group by qs.user_id
  ), trade_users as (
    select distinct t.user_id from public.trades t
  ), realized_totals as (
    select t.user_id,
      coalesce(sum(t.realized_profit), 0)::numeric realized_profit,
      coalesce(sum(t.cost_basis), 0)::numeric realized_cost_basis
    from public.trades t
    where t.trade_type = 'sell'
    group by t.user_id
  ), portfolio_totals as (
    select p.user_id,
      coalesce(sum(p.quantity * p.avg_cost) filter (where p.quantity > 0), 0)::numeric portfolio_cost_basis,
      count(*) filter (where p.quantity > 0)::bigint holding_count,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'ticker', p.ticker,
            'quantity', p.quantity,
            'avg_cost', p.avg_cost,
            'updated_at', p.updated_at
          ) order by p.ticker
        ) filter (where p.quantity > 0),
        '[]'::jsonb
      ) holdings
    from public.portfolio p
    group by p.user_id
  )
  select
    u.id,
    coalesce(nullif(u.nickname, ''), nullif(split_part(u.email, '@', 1), '')),
    coalesce(u.coins, 0)::integer,
    coalesce(q.total_earned_coins, 0)::bigint,
    coalesce(r.realized_profit, 0)::numeric,
    coalesce(r.realized_cost_basis, 0)::numeric,
    case
      when coalesce(r.realized_cost_basis, 0) > 0
        then round((r.realized_profit / r.realized_cost_basis) * 100, 2)
      else 0::numeric
    end,
    coalesce(p.portfolio_cost_basis, 0)::numeric,
    coalesce(p.holding_count, 0)::bigint,
    coalesce(p.holdings, '[]'::jsonb)
  from public.users u
  left join quiz_totals q on q.user_id = u.id
  left join trade_users tu on tu.user_id = u.id
  left join realized_totals r on r.user_id = u.id
  left join portfolio_totals p on p.user_id = u.id
  where (p_class_id is null or exists (
      select 1 from public.class_members cm
      where cm.class_id = p_class_id and cm.user_id = u.id
    ))
    and (p_class_id is not null or not exists (
      select 1 from public.class_members privacy_cm
      where privacy_cm.user_id = u.id and privacy_cm.show_in_global_ranking = false
    ))
    and (
      p_class_id is not null
      or coalesce(q.total_earned_coins, 0) > 0
      or tu.user_id is not null
      or coalesce(p.holding_count, 0) > 0
    )
  order by coalesce(u.coins, 0) + coalesce(p.portfolio_cost_basis, 0) desc,
    coalesce(p.holding_count, 0) desc,
    coalesce(q.total_earned_coins, 0) desc,
    case
      when coalesce(r.realized_cost_basis, 0) > 0
        then r.realized_profit / r.realized_cost_basis
      else 0
    end desc,
    u.created_at asc
  limit least(greatest(coalesce(p_limit, 500), 1), 500);
end;
$$;

revoke all on function public.get_learning_rankings(integer, uuid) from public, anon;
grant execute on function public.get_learning_rankings(integer, uuid) to authenticated;
