-- 2026-08-04: restore authenticated app access while keeping every row owner-scoped.
grant usage on schema public to authenticated;

grant select, insert, update on table public.users to authenticated;
grant select, insert on table public.quiz_sessions to authenticated;
grant select, insert on table public.trades to authenticated;
grant select, insert, update, delete on table public.portfolio to authenticated;

alter table public.users enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.trades enable row level security;
alter table public.portfolio enable row level security;

drop policy if exists "본인만 접근" on public.users;
drop policy if exists "본인 정보 읽기" on public.users;
drop policy if exists "본인 정보 생성" on public.users;
drop policy if exists "본인 정보 수정" on public.users;
create policy "본인 정보 읽기"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);
create policy "본인 정보 생성"
  on public.users for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "본인 정보 수정"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "본인만 접근" on public.quiz_sessions;
drop policy if exists "본인만 쓰기" on public.quiz_sessions;
drop policy if exists "본인 퀴즈 기록 읽기" on public.quiz_sessions;
drop policy if exists "본인 퀴즈 기록 생성" on public.quiz_sessions;
create policy "본인 퀴즈 기록 읽기"
  on public.quiz_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 퀴즈 기록 생성"
  on public.quiz_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "본인만 접근" on public.trades;
drop policy if exists "본인만 쓰기" on public.trades;
drop policy if exists "본인 거래 읽기" on public.trades;
drop policy if exists "본인 거래 생성" on public.trades;
create policy "본인 거래 읽기"
  on public.trades for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 거래 생성"
  on public.trades for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "본인만 접근" on public.portfolio;
drop policy if exists "본인 포트폴리오 읽기" on public.portfolio;
drop policy if exists "본인 포트폴리오 생성" on public.portfolio;
drop policy if exists "본인 포트폴리오 수정" on public.portfolio;
drop policy if exists "본인 포트폴리오 삭제" on public.portfolio;
create policy "본인 포트폴리오 읽기"
  on public.portfolio for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "본인 포트폴리오 생성"
  on public.portfolio for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "본인 포트폴리오 수정"
  on public.portfolio for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "본인 포트폴리오 삭제"
  on public.portfolio for delete to authenticated
  using ((select auth.uid()) = user_id);
