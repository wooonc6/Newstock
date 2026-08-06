-- 실제 기사 원문과 검증된 3거래일 영향을 저장한다.
alter table public.curated_news
  add column if not exists source_url text,
  add column if not exists description text,
  add column if not exists published_at timestamptz,
  add column if not exists is_active boolean not null default true,
  add column if not exists impact_days smallint not null default 3,
  add column if not exists impact_base_date date,
  add column if not exists impact_base_price numeric,
  add column if not exists impact_date date,
  add column if not exists impact_price numeric,
  add column if not exists impact_change numeric,
  add column if not exists impact_direction text,
  add column if not exists last_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'curated_news_impact_days_check'
      and conrelid = 'public.curated_news'::regclass
  ) then
    alter table public.curated_news
      add constraint curated_news_impact_days_check check (impact_days = 3);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'curated_news_impact_direction_check'
      and conrelid = 'public.curated_news'::regclass
  ) then
    alter table public.curated_news
      add constraint curated_news_impact_direction_check
      check (impact_direction is null or impact_direction in ('up', 'down'));
  end if;
end
$$;

create unique index if not exists curated_news_ticker_source_url_key
  on public.curated_news (ticker, source_url);

create index if not exists curated_news_active_ticker_date_idx
  on public.curated_news (ticker, is_active, news_date desc);

-- 하루 한 번 실행되는 수집 작업의 결과를 기록한다.
create table if not exists public.news_sync_runs (
  id uuid primary key default gen_random_uuid(),
  sync_date date not null unique,
  status text not null check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  active_news_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  error text
);

alter table public.news_sync_runs enable row level security;

revoke all on table public.news_sync_runs from anon, authenticated;
grant all on table public.news_sync_runs to service_role;

revoke insert, update, delete on table public.curated_news from anon, authenticated;
grant select on table public.curated_news to anon, authenticated;
grant all on table public.curated_news to service_role;

-- 예약 실행은 아래 두 Vault 값이 준비된 뒤 별도 설정 SQL로 등록한다.
-- newstock_project_url: https://<project-ref>.supabase.co
-- newstock_publishable_key: Supabase publishable/legacy anon key
