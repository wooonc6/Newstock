-- 회원가입 시 users 테이블에 자동으로 행 추가
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (local_id, username)
  values (new.id, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- users 테이블: 본인 데이터만 읽기/쓰기
alter table users enable row level security;
create policy "본인만 접근" on users
  using (local_id = auth.uid()::text);

-- quiz_sessions: 본인 데이터만
alter table quiz_sessions enable row level security;
create policy "본인만 접근" on quiz_sessions
  using (user_local_id = auth.uid()::text);

-- trades: 본인 데이터만
alter table trades enable row level security;
create policy "본인만 접근" on trades
  using (user_local_id = auth.uid()::text);

-- portfolio: 본인 데이터만
alter table portfolio enable row level security;
create policy "본인만 접근" on portfolio
  using (user_local_id = auth.uid()::text);

-- quiz_questions: 모든 사용자 읽기 허용
alter table quiz_questions enable row level security;
create policy "모두 읽기 가능" on quiz_questions
  for select using (true);
