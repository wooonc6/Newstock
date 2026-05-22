# Newstock 팀 가이드

> 뉴스를 읽고 주가 등락을 예측하며 모의 투자를 배우는 학습 게임 서비스

---

## 서비스 플로우

```
과거 뉴스 (1/3/6개월 전) → "이 뉴스 이후 주가가 올랐을까요?" → 정답 맞히면 투자 권한 해제
→ 실시간 야후 주가로 모의투자 → 수익률로 랭킹 경쟁
```

- 퀴즈: 뉴스 발생일 D vs D+1 야후 종가 비교 → 상승/하락 자동 판정 (Claude API 불필요)
- 주가: yahoo-finance2 실시간 연동 (이미 구현됨)
- 뉴스: 네이버 뉴스 API

---

## 디자인 레퍼런스

`reference/design_reference.html` — 브라우저로 열면 전체 UI 확인 가능  
담당 화면 CSS/구조를 보고 `.tsx` 컴포넌트로 변환해서 `feat/*` 브랜치에 작업

---

## 현재 완료된 것

| 기능 | 상태 |
|------|------|
| 로그인 / 회원가입 | ✅ |
| 페이지 라우팅 전체 | ✅ |
| 실시간 야후 주가 API | ✅ |
| 대시보드 + 퀴즈 언락 UI | ✅ |
| 헤더 / 네비게이션 | ✅ |

---

## 팀원별 할 일

---

### 이은우 (DB)
**브랜치: `feat/db-schema` → `feat/db-sync`**

> ⚡ 다른 기능 전부 DB에 의존 — 가장 먼저 완료 필요

**1. Supabase 테이블 생성** (`feat/db-schema`)

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

**2. 인증 연동** (`feat/db-sync`)
- 회원가입 시 `users` 테이블 자동 생성 트리거
- 각 테이블 RLS 설정 (본인 데이터만 읽기/쓰기)

---

### 김성준 (Backend)
**브랜치: `feat/news-collector` → `feat/unlock-backend` → `feat/trade-logic`**

**1. 뉴스 수집 + 퀴즈 문제 생성** (`feat/news-collector`)

```
GET /api/news/collect?ticker=005930.KS&period=1m

흐름:
네이버 뉴스 API → 1개월 전 종목 관련 뉴스 수집
→ yahoo-finance2로 뉴스 날짜(D), 다음날(D+1) 종가 조회
→ price_before vs price_after 비교 → answer = 'up' | 'down' 자동 판정
→ quiz_questions 테이블 저장
```

**2. 퀴즈 채점 + 코인 지급** (`feat/unlock-backend`)

```
POST /api/quiz/submit
body: { question_id, user_answer: 'up' | 'down' }

흐름:
정답 확인 → quiz_sessions 저장
→ 해당 종목 3문제 통과 시 투자 권한 해제
→ 정답 시 users.coins 증가
```

**3. 매수/매도 처리** (`feat/trade-logic`)

```
POST /api/trade
body: { ticker, type: 'buy' | 'sell', quantity }

흐름:
현재 야후 주가 조회 → users.coins 차감/증가
→ portfolio, trades 테이블 업데이트
```

---

### 김승민A (API/FE)
**브랜치: `feat/stock-price-ui` → `feat/news-feed-ui` → `feat/ranking-ui`**

**1. 빌드 에러 수정** (`feat/stock-price-ui`) — 우선순위 1

`next.config.mjs` webpack 설정 수정  
현재 `yahoo-finance2` Deno 의존성 에러 발생 중 → 해결 후 `npm run dev` 정상 확인

**2. 퀴즈 화면 UI** (`feat/news-feed-ui`)

`src/app/(main)/quiz/[stock]/page.tsx`
- 뉴스 기사 제목 / 날짜 표시
- "주가 상승" / "주가 하락" 버튼 2개
- 정답 후 실제 주가 변동 결과 표시

> 디자인: `reference/design_reference.html` 퀴즈 탭 참고

**3. 랭킹 페이지** (`feat/ranking-ui`)

`src/app/(main)/ranking/page.tsx`
- 포트폴리오 수익률 기준 전체 순위
- 1~3위 🥇🥈🥉 메달 표시
- 내 순위 강조

> 디자인: `reference/design_reference.html` 랭킹 탭 참고

---

### 허조영 (UI/UX)
**브랜치: `feat/design-system` → `feat/stock-card-ui` → `feat/onboarding-ui`**

> 🎨 `reference/design_reference.html` 브라우저로 열어서 각 화면 확인 후 React로 변환

**1. 공통 컴포넌트** (`feat/design-system`)

`src/components/ui/` 폴더에 생성:
- `Button.tsx` — primary / outline / danger
- `Badge.tsx` — 섹터 배지, 랭킹 메달
- `Card.tsx` — 공통 카드 래퍼
- `Toast.tsx` — 토스트 알림

HTML의 CSS 변수 (`--accent`, `--bg`, `--surface` 등) → `globals.css`에 반영

**2. 카드 UI 개선** (`feat/stock-card-ui`)
- 퀴즈 통과 시 잠금 해제 애니메이션
- 모바일 반응형 점검

**3. 온보딩 화면** (`feat/onboarding-ui`)

첫 로그인 시 표시:
1. 서비스 소개
2. 뉴스 읽기 → 퀴즈 풀기 → 투자하기 3단계 안내

---

### 최원준 (PM/FE)
**브랜치: `feat/quiz-unlock` → `feat/page-routing`**

> 로그인/회원가입, 미들웨어, 라우팅은 이미 완료

**1. 헤더 DB 연결** (이은우 완료 후)

`src/components/layout/Header.tsx`  
코인 수, 스트릭 → `users` 테이블에서 실제 값 불러오도록 수정

**2. 퀴즈 화면 연결** (김성준 완료 후)

`src/app/(main)/quiz/[stock]/page.tsx`  
김성준 뉴스 API + 채점 API 연결

**3. 포트폴리오 화면 완성** (김성준 완료 후)

`src/app/(main)/portfolio/page.tsx`  
매수/매도 거래 API 연결 + 실시간 수익률 표시

---

## 개발 순서

```
Week 1   이은우 DB 생성 + 김승민A 빌드 에러 수정
Week 2   김성준 뉴스/채점 API + 허조영 공통 컴포넌트
Week 3   최원준 화면 연결 + 김승민A 퀴즈/랭킹 UI
Week 4   dev 통합 테스트 → main PR
```

---

## GitHub에 올리는 방법

### 1. 처음 한 번만 — 레포 클론

```bash
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 2. 작업 시작 — 내 브랜치로 이동

```bash
# dev 최신 내용 먼저 받기
git checkout dev
git pull origin dev

# 내 브랜치로 이동 (없으면 새로 생성됨)
git checkout -b feat/내브랜치명
# 이미 있으면: git checkout feat/내브랜치명
```

### 3. 작업 후 — 저장하고 올리기

```bash
# 변경된 파일 확인
git status

# 파일 추가
git add .

# 커밋 (메시지 규칙: feat/fix/chore/style/refactor/docs)
git commit -m "feat: 작업한 내용 한 줄 설명"

# 깃허브에 올리기
git push origin feat/내브랜치명
```

### 4. PR 올리기 — dev 브랜치로 합치기

1. https://github.com/wooonc6/Newstock 접속
2. 상단에 뜨는 **"Compare & pull request"** 버튼 클릭
3. base 브랜치: `dev` 확인 후 PR 생성
4. 팀원 리뷰 후 머지

> ⚠️ `main`에 직접 push 금지 — 반드시 `dev` 거쳐서 PR로 합칠 것

---

## 환경 변수

`.env.example` 복사 → `.env.local` 만들고 키 입력 (절대 커밋 금지)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```
