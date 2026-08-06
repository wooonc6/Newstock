-- 회원가입 시 users 테이블에 자동으로 행 추가하는 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nickname)
  values (new.id, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS(Row Level Security) 설정
alter table curated_news enable row level security;
drop policy if exists "모두 읽기 가능" on curated_news;
create policy "모두 읽기 가능" on curated_news for select using (true);

alter table stock_price_cache enable row level security;
drop policy if exists "모두 읽기 가능" on stock_price_cache;
create policy "모두 읽기 가능" on stock_price_cache for select using (true);
drop policy if exists "서비스 쓰기 허용" on stock_price_cache;
create policy "서비스 쓰기 허용" on stock_price_cache for all using (true);

alter table users enable row level security;
drop policy if exists "본인만 접근" on users;
create policy "본인만 접근" on users using (id = auth.uid());

alter table quiz_sessions enable row level security;
drop policy if exists "본인만 접근" on quiz_sessions;
create policy "본인만 접근" on quiz_sessions using (user_id = auth.uid());
drop policy if exists "본인만 쓰기" on quiz_sessions;
create policy "본인만 쓰기" on quiz_sessions for insert with check (user_id = auth.uid());

alter table trades enable row level security;
drop policy if exists "본인만 접근" on trades;
create policy "본인만 접근" on trades using (user_id = auth.uid());
drop policy if exists "본인만 쓰기" on trades;
create policy "본인만 쓰기" on trades for insert with check (user_id = auth.uid());

alter table portfolio enable row level security;
drop policy if exists "본인만 접근" on portfolio;
create policy "본인만 접근" on portfolio using (user_id = auth.uid());
