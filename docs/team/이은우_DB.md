# 이은우 — DB 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/db-schema` | Supabase 테이블 생성 (SQL 실행) | 1번 |
| `feat/db-sync` | RLS 설정 + 회원가입 트리거 | 2번 |

> ⚡ 다른 기능 전부 DB에 의존 — 가장 먼저 완료 필요

---

## 1. Supabase 테이블 생성 (`feat/db-schema`)

Supabase 대시보드 → SQL Editor에 아래 SQL 실행:

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

---

## 2. 인증 연동 (`feat/db-sync`)

- 회원가입 시 `users` 테이블 자동 생성 트리거
- 각 테이블 RLS 설정 (본인 데이터만 읽기/쓰기 가능)

---

## GitHub에 올리는 방법

### 처음 한 번만 — 레포 클론

```bash
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 작업 시작

```bash
git checkout dev
git pull origin dev
git checkout -b feat/db-schema
```

### 작업 후 올리기

```bash
git add .
git commit -m "feat: Supabase 테이블 생성"
git push origin feat/db-schema
```

두 번째 브랜치:

```bash
git checkout dev && git pull origin dev
git checkout -b feat/db-sync
# 작업 후
git add . && git commit -m "feat: RLS 및 회원가입 트리거 추가"
git push origin feat/db-sync
```

### PR 올리기

1. https://github.com/wooonc6/Newstock 접속
2. **"Compare & pull request"** 클릭
3. base 브랜치 → `dev` 확인 후 PR 생성

> ⚠️ `main`에 직접 push 금지
