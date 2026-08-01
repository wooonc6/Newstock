-- Supabase Vault에 아래 이름의 값이 먼저 저장되어 있어야 한다.
-- newstock_project_url, newstock_publishable_key

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('newstock-daily-news-sync')
where exists (
  select 1 from cron.job where jobname = 'newstock-daily-news-sync'
);

select cron.schedule(
  'newstock-daily-news-sync',
  '10 21 * * *', -- 매일 06:10 KST (UTC 21:10)
  $job$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'newstock_project_url'
    ) || '/functions/v1/news-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'newstock_publishable_key'
      )
    ),
    body := jsonb_build_object('scheduled_at', now()),
    timeout_milliseconds := 10000
  ) as request_id;
  $job$
);
