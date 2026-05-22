# Newstock 팀 개발 가이드

> 뉴스를 읽고 주가 등락을 예측하며 모의 투자를 배우는 학습 게임 서비스

---

## 디자인 레퍼런스 파일

**`reference/design_reference.html`** — 전체 UI가 완성된 HTML 파일이 있습니다.

브라우저에서 바로 열어서 확인 가능:
- 로그인 / 퀴즈 / 모의투자 / 랭킹 / 기록 / 통계 화면 전부 구현됨
- 다크 테마, 색상 변수, 컴포넌트 스타일 모두 참고 가능
- **각자 담당 화면을 이 HTML 보고 React 컴포넌트로 변환하면 됩니다**

> ⚠️ HTML의 퀴즈 로직(Claude API 사용)과 주가(랜덤 시뮬레이션)는 우리 방식과 다름 — 아래 참고

---

## 서비스 핵심 플로우

```
과거 뉴스 기사 (1/3/6개월 전 종목 관련 뉴스)
        ↓
  "이 뉴스 이후 주가가 올랐을까요, 내렸을까요?"
        ↓
    정답 맞히면 해당 종목 투자 권한 해제
        ↓
  실시간 야후 주가로 모의 투자 시작
        ↓
    포트폴리오 수익률로 랭킹 경쟁
```

---

## 퀴즈 방식 상세

### 핵심 아이디어
- 1개월 전 / 3개월 전 / 6개월 전에 실제로 해당 종목 주가에 직접적 영향을 준 뉴스 기사를 보여줌
- 야후 파이낸스에서 뉴스 발생일 기준 주가 변동 데이터를 가져와서 정답으로 활용
- 사용자는 "주가 상승" / "주가 하락" 중 하나를 선택
- **Claude API 불필요** — 뉴스 + 야후 주가 데이터만으로 문제 구성 가능

### 문제 구성 예시
```
[뉴스] 삼성전자, HBM 납품 계약 체결 (2024년 11월)

이 뉴스가 발표된 다음 날 삼성전자 주가는?
  ① 상승했다   ② 하락했다

정답: ① 상승 (+3.2%, 78,400원 → 80,900원)
```

### 야후 파이낸스 연동 방식
- `yahoo-finance2` 라이브러리로 과거 주가 조회 가능
- 뉴스 발생일 D, 그 다음날 D+1 종가 비교 → 상승/하락 판정
- 종목별 3문제 풀면 해당 종목 모의투자 해제

---

## 모의 투자 방식

### 퀴즈 통과 후 활성화
- 종목별 퀴즈 3문제 모두 통과 → 해당 종목 투자 권한 해제
- 실시간 야후 주가 데이터로 매수 / 매도 가능
- 초기 시드 머니: 모든 사용자 동일 (1,000,000 코인 / 코인 1개 = ₩1,000)

### 수익률 계산
- 매수 시점 주가 vs 현재 주가로 실시간 수익률 표시
- 포트폴리오 전체 수익률 = 랭킹 기준

---

## 랭킹 시스템
- 전체 사용자 포트폴리오 수익률 순위
- 주간 / 전체 기간 랭킹 분리
- 상위 랭커 메달 표시 (🥇🥈🥉)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| FE | Next.js 14 (TypeScript) + Tailwind CSS |
| BE | Next.js API Routes |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| 주가 데이터 | Yahoo Finance API (yahoo-finance2) |
| 뉴스 데이터 | 네이버 뉴스 API |
| 호스팅 | Vercel |

---

## 현재 구현 완료된 것

| 기능 | 상태 |
|------|------|
| 로그인 / 회원가입 | ✅ 완료 |
| 페이지 라우팅 전체 | ✅ 완료 |
| 실시간 주가 조회 API | ✅ 완료 |
| 대시보드 (종목 카드 목록) | ✅ 완료 |
| 퀴즈 언락 UI | ✅ 완료 |
| 헤더 / 네비게이션 | ✅ 완료 |

---

## Supabase 테이블 SQL

> Supabase 대시보드 → SQL Editor에 붙여넣기

```sql
-- 사용자 정보
CREATE TABLE users (
  local_id  TEXT PRIMARY KEY,
  username  TEXT,
  coins     INT  DEFAULT 1000000,
  streak    INT  DEFAULT 0,
  sessions  INT  DEFAULT 0,
  last_date TEXT,
  tag_stats JSONB DEFAULT '{}',
  portfolio JSONB DEFAULT '{}',
  history   JSONB DEFAULT '[]'
);

-- 퀴즈 문제 (뉴스 + 야후 주가 정답)
CREATE TABLE quiz_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_ticker TEXT,
  news_title   TEXT,
  news_url     TEXT,
  news_date    DATE,
  price_before NUMERIC,
  price_after  NUMERIC,
  answer       TEXT CHECK (answer IN ('up', 'down')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 퀴즈 세션 기록
CREATE TABLE quiz_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_local_id TEXT,
  news_snippet  TEXT,
  score         INT,
  total_q       INT,
  pct           INT,
  coins_earned  INT,
  played_at     TIMESTAMPTZ DEFAULT now()
);

-- 퀴즈 문항별 답안
CREATE TABLE quiz_answers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  tag        TEXT,
  is_correct BOOLEAN
);

-- 거래 기록
CREATE TABLE trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_local_id TEXT,
  ticker        TEXT,
  stock_name    TEXT,
  trade_type    TEXT CHECK (trade_type IN ('buy', 'sell')),
  quantity      NUMERIC,
  price         NUMERIC,
  coins_delta   INT,
  traded_at     TIMESTAMPTZ DEFAULT now()
);

-- 포트폴리오
CREATE TABLE portfolio (
  user_local_id TEXT,
  ticker        TEXT,
  stock_name    TEXT,
  quantity      NUMERIC,
  avg_cost      NUMERIC,
  updated_at    TIMESTAMPTZ,
  PRIMARY KEY (user_local_id, ticker)
);
```

---

## 팀원별 할 일

### 이은우 (DB) — `feat/db-schema` `feat/db-sync`
> ⚡ 다른 모든 기능이 DB에 의존하므로 가장 먼저 완료 필요

**`feat/db-schema`**
- 위 SQL을 Supabase에 실행해서 테이블 생성
- RLS (Row Level Security) 설정 — 본인 데이터만 읽기/쓰기 가능하도록

**`feat/db-sync`**
- 회원가입 시 `users` 테이블 자동 생성 트리거
- Next.js `AuthContext.tsx`의 Supabase 인증과 연동 확인

---

### 김성준 (Backend) — `feat/news-collector` `feat/trade-logic` `feat/unlock-backend`

**`feat/news-collector` — 뉴스 수집 + 퀴즈 문제 생성**

```
GET /api/news/collect?ticker=005930.KS&period=1m
  1. 네이버 뉴스 API로 1개월 전 해당 종목 뉴스 수집
  2. yahoo-finance2로 뉴스 발생일(D)과 다음날(D+1) 주가 조회
  3. price_before vs price_after → answer = 'up' or 'down' 자동 판정
  4. quiz_questions 테이블에 저장
```

**`feat/unlock-backend` — 퀴즈 채점 + 코인 지급**

```
POST /api/quiz/submit
  body: { question_id, user_answer: 'up' | 'down' }
  → 정답 확인 후 quiz_sessions 저장
  → 해당 종목 3문제 통과 시 포트폴리오 접근 권한 부여
  → 정답 시 users.coins 증가
```

**`feat/trade-logic` — 매수/매도**

```
POST /api/trade
  body: { ticker, type: 'buy' | 'sell', quantity }
  → 현재 야후 주가 조회
  → users.coins 차감/증가
  → portfolio, trades 테이블 업데이트
```

---

### 김승민A (API/FE) — `feat/news-feed-ui` `feat/stock-price-ui` `feat/ranking-ui`

**`feat/stock-price-ui` — 빌드 에러 수정 (우선순위 1)**
- `next.config.mjs` webpack 설정 — yahoo-finance2 Deno 의존성 에러 해결 중

**`feat/news-feed-ui` — 퀴즈 화면 UI**

`src/app/(main)/quiz/[stock]/page.tsx` 구현:
- 뉴스 기사 제목 / 날짜 표시
- "주가 상승" / "주가 하락" 선택 버튼 2개
- 정답 후 실제 주가 변동 결과 애니메이션 표시

> UI 참고: `reference/design_reference.html` 퀴즈 탭

**`feat/ranking-ui` — 랭킹 페이지**

`src/app/(main)/ranking/page.tsx` 구현:
- 포트폴리오 수익률 기준 전체 순위
- 주간 / 전체 탭 전환
- 1~3위 메달 강조

> UI 참고: `reference/design_reference.html` 랭킹 탭

---

### 허조영 (UI/UX) — `feat/design-system` `feat/stock-card-ui` `feat/onboarding-ui`

> 🎨 `reference/design_reference.html`을 브라우저로 열면 전체 디자인 확인 가능

**`feat/design-system` — 공통 컴포넌트**

`src/components/ui/` 폴더에 생성:
- `Button.tsx` — primary / outline / danger 변형
- `Badge.tsx` — 섹터 배지, 랭킹 메달
- `Card.tsx` — 공통 카드 래퍼
- `Toast.tsx` — 토스트 알림 (HTML의 showToast 참고)

HTML의 CSS 변수 (`--accent`, `--bg`, `--surface` 등)를 `globals.css`에 반영

**`feat/stock-card-ui` — StockQuizCard 개선**
- 퀴즈 완료 시 잠금 해제 애니메이션
- 모바일 반응형 레이아웃

**`feat/onboarding-ui` — 온보딩 화면**
- 첫 로그인 시 3단계 안내: 뉴스 읽기 → 퀴즈 풀기 → 투자하기
- HTML의 웰컴 토스트 참고

---

### 최원준 (PM/FE) — `feat/quiz-unlock` `feat/page-routing`

**완료된 작업** — 로그인/회원가입, 미들웨어, 라우팅, 대시보드 카드

**남은 작업**

1. `next.config.mjs` 빌드 에러 수정 (김승민A와 협의)
2. `Header.tsx` — coins, streak를 `users` 테이블에서 실제로 불러오기 (이은우 DB 완료 후)
3. `quiz/[stock]/page.tsx` — 퀴즈 화면 연결 (김성준 API 완료 후)
4. `portfolio/page.tsx` — 모의투자 화면 완성 (김성준 trade-logic 완료 후)

---

## 개발 순서

```
Week 1
  이은우: Supabase 테이블 생성 → dev 머지
  김승민A: 빌드 에러 수정

Week 2
  김성준: 뉴스 수집 API + 퀴즈 채점 API
  허조영: 공통 컴포넌트 + 퀴즈/랭킹 UI 참고 구현

Week 3
  최원준: 퀴즈 화면 + 포트폴리오 화면 연결
  김승민A: 뉴스 피드 UI + 랭킹 페이지

Week 4
  전체: dev 브랜치 통합 테스트 → main PR
```

---

## Git 규칙

```
feat/기능명 → PR → dev → PR → main
```

- `main` 직접 push 금지
- PR 전 반드시 `dev` 최신 pull 받고 충돌 해결 후 올리기
- 커밋 컨벤션: `feat` / `fix` / `chore` / `style` / `refactor` / `docs`

---

## 환경 변수

`.env.example` 복사해서 `.env.local` 만들고 키 입력

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

> `.env.local`은 절대 커밋하지 말 것
