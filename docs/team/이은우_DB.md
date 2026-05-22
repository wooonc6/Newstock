# 이은우 — DB 담당

**브랜치: `feat/db-schema` → `feat/db-sync`**

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
