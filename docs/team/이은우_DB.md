# 이은우 — DB 담당

## 담당 작업

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/db-schema` | Supabase 테이블 생성 + 샘플 데이터 입력 | 1번 ⚡ |
| `feat/db-sync` | RLS 설정 + 회원가입 트리거 | 2번 |

> ⚡ 다른 기능 전부 DB에 의존 — 가장 먼저 완료 필요

---

## Supabase 접속 정보

이미 프로젝트가 만들어져 있어요. 아래 URL로 접속:

**https://supabase.com/dashboard/project/zsdhvaylgwmmohecrsfs**

> 최원준에게 Supabase 초대 링크 받아서 접속하면 됩니다.

---

## 1. Supabase 테이블 생성 (`feat/db-schema`)

### Supabase SQL Editor 여는 방법

1. 위 URL로 접속
2. 왼쪽 사이드바 **"SQL Editor"** 클릭 (`</>` 모양)
3. **"+ New query"** 클릭
4. 아래 SQL 전체 복사 → 붙여넣기
5. **"RUN"** 버튼 클릭 (또는 `Ctrl + Enter`)

```sql
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
```

실행 후 왼쪽 사이드바 **"Table Editor"**에서 테이블 6개가 생겼는지 확인.

---

## 2. 뉴스 샘플 데이터 입력 (`feat/db-schema`)

> ⚠️ 이것이 핵심! 데이터가 없으면 퀴즈 화면이 비어 있음

SQL Editor에서 새 쿼리로 아래 SQL 실행:

```sql
insert into curated_news (title, company, ticker, news_date, category, difficulty) values
-- 삼성전자 뉴스
('삼성전자, HBM3 양산 성공… 엔비디아에 공급 임박', '삼성전자', '005930.KS', '2024-01-15', 'IT', 'easy'),
('삼성전자 4분기 영업이익 2.8조원 '어닝쇼크'', '삼성전자', '005930.KS', '2024-01-09', 'IT', 'medium'),
('삼성전자, 파운드리 2나노 공정 개발 완료 선언', '삼성전자', '005930.KS', '2023-10-12', 'IT', 'hard'),

-- LG화학 뉴스
('LG화학, 양극재 공장 북미 증설 2조원 투자 확정', 'LG화학', '051910.KS', '2024-02-20', '화학', 'medium'),
('전기차 수요 둔화에 LG에너지솔루션 실적 우려 확대', 'LG화학', '051910.KS', '2024-01-30', '화학', 'easy'),
('LG화학, 미국 IRA 세액공제 최대 수혜 전망', 'LG화학', '051910.KS', '2023-09-05', '화학', 'hard'),

-- 두산에너빌리티 뉴스
('두산에너빌리티, 체코 원전 수주 우선협상대상자 선정', '두산에너빌리티', '034020.KS', '2024-07-18', '에너지', 'easy'),
('SMR(소형모듈원자로) 열풍에 두산에너빌리티 수혜 기대', '두산에너빌리티', '034020.KS', '2024-03-10', '에너지', 'medium'),
('두산에너빌리티, 가스터빈 국산화 첫 상업운전 성공', '두산에너빌리티', '034020.KS', '2023-11-22', '에너지', 'hard');
```

실행 후 Table Editor → `curated_news` 테이블에 9개 행이 보이면 완료.

---

## 3. 인증 연동 (`feat/db-sync`)

### 회원가입 트리거 SQL

```sql
-- 회원가입 시 users 테이블에 자동으로 행 추가
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nickname)
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
-- curated_news: 모든 사용자 읽기 허용 (퀴즈 문제는 공개)
alter table curated_news enable row level security;
create policy "모두 읽기 가능" on curated_news
  for select using (true);

-- stock_price_cache: 모두 읽기 허용
alter table stock_price_cache enable row level security;
create policy "모두 읽기 가능" on stock_price_cache
  for select using (true);
create policy "서비스 쓰기 허용" on stock_price_cache
  for all using (true);

-- users: 본인 데이터만 읽기/쓰기
alter table users enable row level security;
create policy "본인만 접근" on users
  using (id = auth.uid());

-- quiz_sessions: 본인 데이터만
alter table quiz_sessions enable row level security;
create policy "본인만 접근" on quiz_sessions
  using (user_id = auth.uid());
create policy "본인만 쓰기" on quiz_sessions
  for insert with check (user_id = auth.uid());

-- trades: 본인 데이터만
alter table trades enable row level security;
create policy "본인만 접근" on trades
  using (user_id = auth.uid());
create policy "본인만 쓰기" on trades
  for insert with check (user_id = auth.uid());

-- portfolio: 본인 데이터만
alter table portfolio enable row level security;
create policy "본인만 접근" on portfolio
  using (user_id = auth.uid());
```

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. 상단 메뉴 **Terminal → New Terminal** 클릭
3. 또는 단축키 **Ctrl + `** (백틱, 숫자 1 왼쪽 키)

**방법 B — Windows 터미널 직접 사용**
1. 시작 메뉴에서 **"PowerShell"** 또는 **"명령 프롬프트"** 검색 후 실행

---

### 1. 처음 한 번만 — 레포 클론

```bash
cd Desktop
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 환경변수 설정 (처음 한 번)

`.env.example`을 복사해 `.env.local`을 만들고, 팀 내부 공유 채널에서 받은 실제 값을 입력합니다.

```bash
copy .env.example .env.local
```

> `.env.local`은 GitHub에 올리지 않습니다.

---

### 2. 브랜치 만들고 작업

```bash
# 최신 코드 받기
git checkout main
git pull origin main

# 내 브랜치 만들기
# main에서 바로 작업
```

SQL을 Supabase에서 실행한 뒤, SQL 파일을 레포에도 저장:
- `docs/db/01_schema.sql` — 테이블 생성 SQL
- `docs/db/02_sample_data.sql` — 샘플 뉴스 데이터 SQL

```bash
git add .
git commit -m "feat: Supabase 테이블 생성 및 샘플 데이터 추가"
git push origin main
```

push한 뒤 Vercel 배포와 Supabase 적용 상태를 확인합니다.

---

### 3. 두 번째 브랜치

```bash
git checkout main
git pull origin main

# RLS + 트리거 SQL을 docs/db/03_rls.sql 로 저장
git add .
git commit -m "feat: RLS 및 회원가입 트리거 추가"
git push origin main
```

---

## 이 프로젝트 폴더 구조 (DB 담당 관련)

```
Newstock/
├── docs/db/               ← SQL 파일 저장 위치 (직접 만들기)
│   ├── 01_schema.sql          테이블 생성 SQL
│   ├── 02_sample_data.sql     뉴스 샘플 데이터 SQL
│   └── 03_rls.sql             RLS + 트리거 SQL
├── src/lib/supabase/
│   ├── client.ts              브라우저용 Supabase 연결 설정
│   └── server.ts              서버용 Supabase 연결 설정
└── .env.local             ← 내용 위에 있음 (커밋 금지)
```

---

## 완료 확인 체크리스트

- [ ] Supabase Table Editor에서 테이블 6개 확인 (`curated_news`, `stock_price_cache`, `users`, `quiz_sessions`, `trades`, `portfolio`)
- [ ] `curated_news`에 뉴스 9개 데이터 입력 완료
- [ ] 회원가입 후 `users` 테이블에 자동으로 행 추가되는지 확인
- [ ] DB schema 작업 main push 완료
- [ ] DB sync 작업 main push 완료
- [ ] 최원준에게 완료 알림
