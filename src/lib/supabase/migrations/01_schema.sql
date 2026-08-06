-- 큐레이션 뉴스 (퀴즈 문제의 원본 뉴스)
create table if not exists curated_news (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  company      text not null,
  ticker       text not null,
  news_date    date not null,
  category     text,
  difficulty   text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at   timestamptz default now()
);

-- 주가 캐시 (API 응답 속도 개선용 — 자동으로 채워짐)
create table if not exists stock_price_cache (
  ticker       text,
  base_date    date,
  price_base   numeric,
  price_1m     numeric,
  price_3m     numeric,
  price_6m     numeric,
  change_1m    numeric,
  change_3m    numeric,
  change_6m    numeric,
  primary key (ticker, base_date)
);

-- 유저 정보
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text,
  coins        int  default 1000000,
  streak       int  default 0,
  sessions     int  default 0,
  last_date    text,
  created_at   timestamptz default now()
);

-- 퀴즈 세션 (유저가 퀴즈를 풀면 기록)
create table if not exists quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  stock_ticker  text not null,
  news_id       uuid references curated_news(id),
  score         int,
  total         int,
  coins_earned  int,
  created_at    timestamptz default now()
);

-- 거래 내역
create table if not exists trades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  ticker        text not null,
  trade_type    text check (trade_type in ('buy', 'sell')),
  quantity      numeric,
  price         numeric,
  coins_delta   int,
  traded_at     timestamptz default now()
);

-- 포트폴리오
create table if not exists portfolio (
  user_id       uuid references auth.users(id) on delete cascade,
  ticker        text not null,
  quantity      numeric,
  avg_cost      numeric,
  updated_at    timestamptz,
  primary key (user_id, ticker)
);
