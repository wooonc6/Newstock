# 이은우 — DB 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/db-schema` | Supabase 테이블 생성 (SQL 실행) | 1번 |
| `feat/db-sync` | RLS 설정 + 회원가입 트리거 | 2번 |

> ⚡ 다른 기능 전부 DB에 의존 — 가장 먼저 완료 필요

---

## 1. Supabase 테이블 생성 (`feat/db-schema`)

### Supabase SQL Editor 여는 방법

1. 브라우저에서 **https://supabase.com** 접속
2. 로그인 후 프로젝트 선택 (Newstock 프로젝트)
3. 왼쪽 사이드바에서 **"SQL Editor"** 클릭 (아이콘: `</>`처럼 생긴 것)
4. 화면 상단 **"+ New query"** 클릭
5. 아래 SQL을 전체 복사해서 붙여넣기
6. 우측 하단 **"RUN"** 버튼 클릭 (또는 `Ctrl + Enter`)

```sql
create table users (
  local_id  text primary key,
  username  text,
  coins     int  default 1000000,
  streak    int  default 0,
  sessions  int  default 0,
  last_date text,
  portfolio jsonb default '{}',
  history   jsonb default '[]'
);

create table quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  stock_ticker text,
  news_title   text,
  news_url     text,
  news_date    date,
  price_before numeric,
  price_after  numeric,
  answer       text check (answer in ('up', 'down')),
  created_at   timestamptz default now()
);

create table quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_local_id text,
  stock_ticker  text,
  score         int,
  total_q       int,
  coins_earned  int,
  played_at     timestamptz default now()
);

create table trades (
  id            uuid primary key default gen_random_uuid(),
  user_local_id text,
  ticker        text,
  trade_type    text check (trade_type in ('buy', 'sell')),
  quantity      numeric,
  price         numeric,
  coins_delta   int,
  traded_at     timestamptz default now()
);

create table portfolio (
  user_local_id text,
  ticker        text,
  quantity      numeric,
  avg_cost      numeric,
  updated_at    timestamptz,
  primary key (user_local_id, ticker)
);
```

실행 후 왼쪽 사이드바 **"Table Editor"**에서 테이블 5개가 생성됐는지 확인.

---

## 2. 인증 연동 (`feat/db-sync`)

### 회원가입 트리거 SQL (같은 방법으로 SQL Editor에서 실행)

```sql
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
```

### RLS(Row Level Security) 설정

```sql
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
```

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. 상단 메뉴 **Terminal → New Terminal** 클릭
3. 또는 단축키 **Ctrl + `** (백틱, 숫자 1 왼쪽 키)
4. 하단에 터미널 창이 열림

**방법 B — Windows 터미널 직접 사용**
1. 시작 메뉴에서 **"PowerShell"** 또는 **"명령 프롬프트"** 검색 후 실행

---

### 1. 처음 한 번만 — 레포 클론

> 이미 레포를 받았다면 이 단계 건너뜀

터미널에서 아래 명령어 순서대로 실행:

```bash
# 1. 작업할 폴더로 이동 (예: 바탕화면)
cd Desktop

# 2. 레포 다운로드
git clone https://github.com/wooonc6/Newstock.git

# 3. 프로젝트 폴더로 이동
cd Newstock

# 4. 필요한 패키지 설치 (한 번만)
npm install
```

---

### 2. 첫 번째 브랜치 작업 (`feat/db-schema`)

```bash
# 프로젝트 폴더에 있는지 확인 (터미널에 .../Newstock 이 보여야 함)

# 최신 코드 받기
git checkout main
git pull origin main

# 내 브랜치 만들기
git checkout -b feat/db-schema
```

SQL을 Supabase에서 실행한 뒤, 실행한 SQL 내용을 파일로도 저장해둬야 해:

```bash
# docs/db/ 폴더에 SQL 파일 저장 (VS Code로 직접 파일 만들어도 됨)
# 예: docs/db/01_schema.sql 에 위 SQL 내용 붙여넣기
```

그 다음 GitHub에 올리기:

```bash
git add .
git commit -m "feat: Supabase 테이블 생성"
git push origin feat/db-schema
```

---

### 3. 두 번째 브랜치 작업 (`feat/db-sync`)

```bash
# 다시 최신 코드 기준으로 새 브랜치 만들기
git checkout main
git pull origin main
git checkout -b feat/db-sync

# 트리거/RLS SQL 파일 저장 후
git add .
git commit -m "feat: RLS 및 회원가입 트리거 추가"
git push origin feat/db-sync
```

---

### 4. PR(Pull Request) 올리기

> push 완료 후 GitHub 웹사이트에서 진행

1. 브라우저에서 **https://github.com/wooonc6/Newstock** 접속
2. 노란색 배너 **"Compare & pull request"** 버튼 클릭
   - 안 보이면 상단 **"Pull requests"** 탭 → **"New pull request"**
3. **base 브랜치**: `dev` 로 설정 (중요!)
4. **compare 브랜치**: 내가 올린 브랜치 (`feat/db-schema` 등) 확인
5. 제목 입력 후 **"Create pull request"** 클릭
6. 최원준에게 카톡으로 PR 링크 전달

> ⚠️ base를 `main`으로 하면 안 됨 — 반드시 `dev`로

---

### 완료 확인 체크리스트

- [ ] Supabase Table Editor에서 테이블 5개 확인
- [ ] 회원가입 후 `users` 테이블에 자동으로 행 추가되는지 확인
- [ ] GitHub에 `feat/db-schema` 브랜치 push 완료
- [ ] GitHub에 `feat/db-sync` 브랜치 push 완료
- [ ] PR 2개 생성 완료 (base: `dev`)

> ⚠️ `main`에 직접 push 금지
