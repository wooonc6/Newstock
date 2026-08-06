-- 2026-08-05: use the email prefix as the learner id and hide inactive users from rankings.

alter table public.users
  add column if not exists email text;

create index if not exists users_nickname_lookup_idx
  on public.users (lower(nickname))
  where nickname is not null;

create unique index if not exists users_email_unique
  on public.users (lower(email))
  where email is not null;

update public.users as u
set email = au.email
from auth.users as au
where u.id = au.id
  and u.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := coalesce(new.raw_user_meta_data->>'email', new.email);
  v_nickname text := nullif(split_part(coalesce(new.raw_user_meta_data->>'email', new.email, ''), '@', 1), '');
begin
  insert into public.users (id, nickname, email, coins, streak, sessions)
  values (new.id, v_nickname, v_email, 0, 0, 0)
  on conflict (id) do update set
    nickname = excluded.nickname,
    email = excluded.email;

  return new;
end;
$$;

update public.users as u
set nickname = nullif(split_part(u.email, '@', 1), '')
where u.email is not null
  and (u.nickname is null or btrim(u.nickname) = '')
  and not exists (
    select 1
    from public.users as other_user
    where other_user.id <> u.id
      and lower(other_user.nickname) = lower(nullif(split_part(u.email, '@', 1), ''))
  );

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
    end
  from public.users as u
  left join quiz_totals as q on q.user_id = u.id
  left join trade_users as tu on tu.user_id = u.id
  left join realized_totals as r on r.user_id = u.id
  where coalesce(q.total_earned_coins, 0) > 0
     or tu.user_id is not null
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
    coalesce(nullif(u.nickname, ''), nullif(split_part(u.email, '@', 1), '')) as nickname,
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
