# Newstock 퀴즈 구현 계획

> 최초 작성일: 2026-05-12
> 판정 방식 개정: 2026-08-01 — 최신 기준은 `NEWS_QUIZ_RULES.md` 참고
> 담당: 최원준 (PM/FE), 김성준 (BE), 이은우 (DB)

---

## 1. 방향

기존 퀴즈 탭 = **과거 뉴스 기반 주가 변동 퀴즈**로 전환.  
별도 트랙 분리 없이, 이 방식이 메인 퀴즈 경험이다.

- 큐레이션된 과거 뉴스 선택 → 뉴스 읽기 → 기사 발표 후 3거래일 주가 방향 맞히기
- 1/3/6개월과 12개월 이상은 한 기사의 비교 기간이 아니라 서로 다른 과거 기사를 분류하는 시기
- 주가 데이터: **Yahoo Finance API** (국내 종목 `.KS` 티커만 지원)
- Claude API 불필요 — 퀴즈 문제와 정답을 실제 데이터로 자동 생성

---

## 2. 퀴즈 화면 흐름

```
[뉴스 카드 목록]          기존 "오늘의 금융 뉴스" 피드를 큐레이션 뉴스 카드로 교체
       ↓
[뉴스 본문 읽기]          뉴스 전문 + "발표 당시 주가: ₩62,400" 표시
       ↓
[퀴즈 — 1개월 후]         4지선다 (주가 변동률 선택)
       ↓
[퀴즈 — 3개월 후]         이전 결과 공개 후 다음 기간으로
       ↓
[퀴즈 — 6개월 후]
       ↓
[결과 화면]               1/3/6개월 비교 + 획득 코인 + 다음 뉴스
```

---

## 3. DB 스키마 (이은우)

### `curated_news` 테이블

```sql
create table curated_news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  company     text not null,           -- 예: 삼성전자
  ticker      text not null,           -- 예: 005930.KS
  news_date   date not null,           -- 뉴스 발표일 (최소 6개월 이전)
  category    text,                    -- 기업실적 / 반도체 / 금리정책 등
  difficulty  text default '보통',     -- 쉬움 / 보통 / 어려움
  created_at  timestamptz default now()
);
```

### `stock_price_cache` 테이블

```sql
create table stock_price_cache (
  id          uuid primary key default gen_random_uuid(),
  ticker      text not null,
  base_date   date not null,
  price_base  numeric,
  price_1m    numeric,
  price_3m    numeric,
  price_6m    numeric,
  change_1m   numeric,
  change_3m   numeric,
  change_6m   numeric,
  cached_at   timestamptz default now(),
  unique (ticker, base_date)
);
```

### 기존 테이블 수정

```sql
-- quiz_sessions에 track_type 컬럼 추가
alter table quiz_sessions add column track_type text default 'learning';
```

---

## 4. 백엔드 API (김성준) — `pages/api/`

> **Express 서버 대신 Next.js API Routes 사용.**  
> 이유: 별도 서버 호스팅 비용 없이 Vercel 무료티어로 프론트+백 통합 배포 가능.  
> `server/` 폴더는 deprecated — 사용하지 말 것.

구현 완료된 파일:
- `lib/yahooFinance.js` — 과거 주가 조회 + 퀴즈 선택지 생성
- `lib/supabase.js` — Supabase 클라이언트
- `pages/api/learning/news.js` — 뉴스 목록
- `pages/api/learning/news/[id].js` — 뉴스 상세
- `pages/api/learning/quiz/[newsId].js` — 퀴즈 데이터

| Method | 경로 | 설명 |
|--------|------|------|
| GET | `/api/learning/news` | 큐레이션 뉴스 목록 |
| GET | `/api/learning/news/:id` | 뉴스 상세 |
| GET | `/api/learning/quiz/:newsId` | 주가 퀴즈 데이터 (선택지 포함) |

### 퀴즈 응답 예시

```json
{
  "newsId": "uuid",
  "company": "삼성전자",
  "ticker": "005930.KS",
  "newsDate": "2023-03-15",
  "headline": "삼성전자 HBM3E 양산 계획 발표",
  "periods": [
    {
      "label": "1개월 후",
      "priceBase": 62400,
      "priceEnd": 69800,
      "changeRate": 11.86,
      "direction": "up",
      "options": ["+11.86%", "+3.1%", "-5.7%", "-11.2%"],
      "answerIndex": 0,
      "coins": 10
    }
  ]
}
```

### 퀴즈 선택지 생성 로직

정답(실제 변동률) 기준 오답 3개 자동 생성:
- 반대 방향 오답 2개
- 같은 방향이지만 수치가 크게 다른 오답 1개
- 선택지 순서 랜덤 셔플

---

## 5. 프론트엔드 (최원준 + 김승민A + 허조영)

기존 퀴즈 탭(`tab-quiz`) 내부를 교체. 탭 자체는 유지.

### 교체 내용

| 기존 | 변경 후 |
|------|---------|
| "직접 입력" 텍스트 영역 | 큐레이션 뉴스 카드 목록 (`/api/learning/news`) |
| AI 신뢰도 검증 배너 | 뉴스 발표 당시 기준 주가 표시 |
| Claude API 퀴즈 생성 | `/api/learning/quiz/:newsId` 호출 |
| 일반 4지선다 | 주가 변동률 4지선다 (1→3→6개월 순차) |
| 단순 정오 해설 | 실제 변동률 + 방향 색상 결과 카드 |

---

## 6. 작업 분담

### 최원준 (PM / FE) — `feat/page-routing`, `feat/quiz-unlock`

- [ ] 기존 퀴즈 탭 UI를 뉴스 카드 목록으로 교체
- [ ] 뉴스 본문 읽기 화면 (발표 당시 주가 표시 포함)
- [ ] 큐레이션 뉴스 데이터 10~20개 수집 후 Supabase 입력
  - 조건: 발표일이 최소 6개월 이전, 국내 종목, Yahoo Finance 티커 확인 필수
- [ ] 퀴즈는 코인 소모 없이 무료 개방으로 확정

### 김성준 (Backend) — `feat/news-collector`, `feat/trade-logic`

- [x] yahoo-finance2 과거 주가 조회 모듈 (`lib/yahooFinance.js`)
- [x] `/api/learning/news`, `/api/learning/quiz/[newsId]` 엔드포인트 (Next.js API Routes)
- [x] 퀴즈 선택지 자동 생성 로직
- [ ] 루트에서 `npm install` 후 로컬 동작 확인
- [ ] 실제 티커로 Yahoo Finance 조회 테스트

### 이은우 (DB) — `feat/db-schema`, `feat/db-sync`

- [ ] `curated_news` 테이블 생성 + RLS 설정
- [ ] `stock_price_cache` 테이블 생성
- [ ] `quiz_sessions`에 `track_type` 컬럼 추가
- [ ] Supabase seed 파일 작성 (초기 뉴스 데이터 insert용)

### 김승민A (API / FE) — `feat/news-feed-ui`, `feat/stock-price-ui`

- [ ] 1/3/6개월 퀴즈 순차 진행 UI
- [ ] 4지선다 선택지 렌더링 + 정답 공개 애니메이션
- [ ] `/api/learning/quiz/:newsId` API 연동
- [ ] 주가 변동률 결과 표시 (숫자 + 방향 색상)

### 허조영 (UI/UX) — `feat/stock-card-ui`, `feat/design-system`

- [ ] 뉴스 카드 컴포넌트 디자인 (기업명, 날짜, 카테고리 배지)
- [ ] 1/3/6개월 주가 비교 결과 카드 디자인
- [ ] 전체 퀴즈 흐름 디자인 시스템 통일

---

## 7. 개발 순서

```
1단계 — 기반 작업 (이은우 + 김성준)
  ① DB 스키마 생성 (curated_news, stock_price_cache)
  ② 서버 로컬 실행 및 Yahoo Finance 조회 테스트
  ③ 큐레이션 뉴스 10개 입력 (최원준)

2단계 — UI 교체 (최원준 + 김승민A + 허조영)
  ④ 기존 퀴즈 탭 내부를 뉴스 카드 목록으로 교체
  ⑤ 뉴스 선택 → 본문 → 퀴즈 흐름 연결
  ⑥ 1/3/6개월 순차 퀴즈 + 결과 화면

3단계 — 마무리
  ⑦ 코인 보상 + 기록 저장 연동
  ⑧ 랭킹 탭 반영
```

---

## 8. 로컬 실행 방법

```bash
# 루트에서 실행
npm install
# .env.local에 SUPABASE_URL, SUPABASE_ANON_KEY 입력 후
npm run dev   # http://localhost:3000
# API: http://localhost:3000/api/learning/news
```

---

## 9. 향후 라이브 트랙 (v2)

현재 퀴즈 완성 후 추가 고려:

- 오늘의 실시간 뉴스 (네이버 뉴스 API)
- Claude API로 퀴즈 자동 생성 (기존 `fetchQuestions` 함수 재사용 가능)
- 사용자 직접 주가 예측 → 1개월 후 실제 결과 알림
