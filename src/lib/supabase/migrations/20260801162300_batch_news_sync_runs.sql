alter table public.news_sync_runs
  add column if not exists batch_index smallint not null default 0;

alter table public.news_sync_runs
  drop constraint if exists news_sync_runs_sync_date_key;

alter table public.news_sync_runs
  drop constraint if exists news_sync_runs_batch_index_check;

alter table public.news_sync_runs
  add constraint news_sync_runs_batch_index_check
  check (batch_index between 0 and 5);

create unique index if not exists news_sync_runs_sync_date_batch_key
  on public.news_sync_runs (sync_date, batch_index);
