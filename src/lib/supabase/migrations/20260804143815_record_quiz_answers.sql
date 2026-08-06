-- 2026-08-04: save each selected answer so quizzes can be resumed one item at a time.

alter table public.quiz_sessions
  add column if not exists user_answer text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_sessions_user_answer_check'
      and conrelid = 'public.quiz_sessions'::regclass
  ) then
    alter table public.quiz_sessions
      add constraint quiz_sessions_user_answer_check
      check (user_answer is null or user_answer in ('up', 'down'));
  end if;
end $$;

-- Existing binary answers can be reconstructed from the stored score and answer direction.
update public.quiz_sessions as session
set user_answer = case
  when session.score = 1 then news.impact_direction
  when news.impact_direction = 'up' then 'down'
  when news.impact_direction = 'down' then 'up'
  else null
end
from public.curated_news as news
where session.news_id = news.id
  and session.user_answer is null
  and session.score in (0, 1)
  and news.impact_direction in ('up', 'down');

create index if not exists quiz_sessions_user_ticker_created_idx
  on public.quiz_sessions (user_id, stock_ticker, created_at desc);

create or replace function public.record_quiz_results(p_results jsonb)
returns table (
  inserted_count integer,
  reward_amount integer,
  balance_after integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_inserted_count integer := 0;
  v_reward_amount integer := 0;
  v_balance_after integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) = 0 then
    raise exception 'At least one quiz result is required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_results) as item
    where not (item ? 'news_id')
      or not (item ? 'correct')
      or not (item ? 'answer')
      or item ->> 'answer' not in ('up', 'down')
  ) then
    raise exception 'Each quiz result requires news_id, correct, and answer' using errcode = '22023';
  end if;

  insert into public.users (id, coins, streak, sessions)
  values (v_user_id, 1000000, 0, 0)
  on conflict (id) do nothing;

  with payload as (
    select distinct on ((item ->> 'news_id')::uuid)
      (item ->> 'news_id')::uuid as news_id,
      (item ->> 'correct')::boolean as is_correct,
      item ->> 'answer' as user_answer
    from jsonb_array_elements(p_results) as item
    order by (item ->> 'news_id')::uuid
  ),
  inserted as (
    insert into public.quiz_sessions (
      user_id,
      stock_ticker,
      news_id,
      user_answer,
      score,
      total,
      coins_earned
    )
    select
      v_user_id,
      news.ticker,
      news.id,
      payload.user_answer,
      case when payload.is_correct then 1 else 0 end,
      1,
      case
        when not payload.is_correct then 0
        when (timezone('Asia/Seoul', now()))::date - news.news_date between 14 and 60 then 50000
        when (timezone('Asia/Seoul', now()))::date - news.news_date between 61 and 135 then 100000
        when (timezone('Asia/Seoul', now()))::date - news.news_date between 136 and 270 then 150000
        when (timezone('Asia/Seoul', now()))::date - news.news_date >= 271 then 200000
        else 0
      end
    from payload
    join public.curated_news as news on news.id = payload.news_id
    on conflict (user_id, news_id) where news_id is not null do nothing
    returning coins_earned
  )
  select count(*)::integer, coalesce(sum(coins_earned), 0)::integer
  into v_inserted_count, v_reward_amount
  from inserted;

  update public.users
  set
    coins = coalesce(coins, 0) + v_reward_amount,
    sessions = coalesce(sessions, 0) + v_inserted_count
  where id = v_user_id
  returning coins into v_balance_after;

  return query select v_inserted_count, v_reward_amount, v_balance_after;
end;
$$;

revoke all on function public.record_quiz_results(jsonb) from public, anon;
grant execute on function public.record_quiz_results(jsonb) to authenticated;
