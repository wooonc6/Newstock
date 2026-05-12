# Newstock 러닝 트랙 구현 계획

> 작성일: 2026-05-12  
> 담당: 최원준 (PM/FE), 김성준 (BE), 이은우 (DB)

---

## 1. 목표

과거 뉴스를 제시하고, Yahoo Finance 실제 주가 데이터를 기반으로  
**"이 뉴스 이후 주가가 어떻게 됐을까?"** 를 퀴즈로 푸는 러닝 트랙 구현.

- 뉴스 발표일 기준 **1개월 / 3개월 / 6개월** 후 주가 변동률을 비교
- Claude API 불필요 — 퀴즈 문제와 정답을 Yahoo Finance 데이터로 자동 생성
- 백엔드는 **Node.js**로 통일

---

## 2. 서비스 흐름

```
유저 → 과거 뉴스 카드 선택
     → 뉴스 본문 읽기
     → "이 뉴스 후 주가는?" 퀴즈 (1/3/6개월 선택지)
     → 정답 확인 + 실제 주가 차트 공개
     → 코인 획득 + 다음 문제
```

---

## 3. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| FE | React / Next.js (TypeScript) | 기존 앱 구조 유지 |
| BE | Node.js + Express | yahoo-finance2 npm 패키지 사용 |
| DB | Supabase (PostgreSQL) | 뉴스 큐레이션 데이터 저장 |
| 주가 데이터 | Yahoo Finance API (yahoo-finance2) | 과거 주가 조회 |
| 인증 | Supabase Auth (기존) | - |

---

## 4. DB 스키마

### `curated_news` 테이블 (뉴스 큐레이션)

```sql
create table curated_news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,           -- 뉴스 제목
  body        text not null,           -- 뉴스 본문
  company     text not null,           -- 관련 기업명 (예: 삼성전자)
  ticker      text not null,           -- Yahoo Finance 티커 (예: 005930.KS)
  news_date   date not null,           -- 뉴스 발표일
  category    text,                    -- 기업실적 / 금리정책 / 반도체 등
  difficulty  text default '보통',     -- 쉬움 / 보통 / 어려움
  created_at  timestamptz default now()
);
```

### `stock_price_cache` 테이블 (주가 캐시, 선택)

```sql
create table stock_price_cache (
  id          uuid primary key default gen_random_uuid(),
  ticker      text not null,
  base_date   date not null,           -- 뉴스 발표일
  price_base  numeric,                 -- 발표일 주가
  price_1m    numeric,                 -- 1개월 후
  price_3m    numeric,                 -- 3개월 후
  price_6m    numeric,                 -- 6개월 후
  cached_at   timestamptz default now(),
  unique (ticker, base_date)
);
```

> Yahoo Finance 호출 결과를 캐시해서 반복 요청 방지.

---

## 5. 백엔드 API (Node.js)

### 엔드포인트 목록

| Method | 경로 | 설명 |
|--------|------|------|
| GET | `/api/learning/news` | 학습용 과거 뉴스 목록 |
| GET | `/api/learning/news/:id` | 뉴스 상세 + 관련 기업 정보 |
| GET | `/api/learning/quiz/:newsId` | 해당 뉴스의 주가 퀴즈 데이터 생성 |
| GET | `/api/stock/history` | Yahoo Finance 과거 주가 조회 |

### `/api/learning/quiz/:newsId` 응답 예시

```json
{
  "newsId": "uuid",
  "company": "삼성전자",
  "ticker": "005930.KS",
  "newsDate": "2023-03-15",
  "headline": "삼성전자 HBM3E 양산 계획 발표",
  "priceBase": 62400,
  "periods": [
    {
      "label": "1개월 후",
      "endDate": "2023-04-15",
      "priceEnd": 69800,
      "changeRate": 11.86,
      "direction": "up"
    },
    {
      "label": "3개월 후",
      "endDate": "2023-06-15",
      "priceEnd": 71500,
      "changeRate": 14.58,
      "direction": "up"
    },
    {
      "label": "6개월 후",
      "endDate": "2023-09-15",
      "priceEnd": 65200,
      "changeRate": 4.49,
      "direction": "up"
    }
  ],
  "quizOptions": ["+11.9% 상승", "+3.1% 상승", "-5.7% 하락", "-11.2% 하락"],
  "answerIndex": 0,
  "difficulty": "보통",
  "coins": 20
}
```

### 퀴즈 선택지 생성 로직

정답(실제 변동률) 기준으로 오답 3개를 자동 생성:
- 오답은 정답의 ±5~15% 범위에서 방향을 반전하거나 수치를 변형
- 선택지 순서는 랜덤 셔플

---

## 6. 프론트엔드 UI

### 새로 추가할 탭/컴포넌트

```
기존 탭: 퀴즈 | 모의투자 | 랭킹 | 기록 | 분석
추가 탭: 📚 러닝 트랙   (기존 퀴즈 탭 앞 또는 별도 분기)
```

### 러닝 트랙 화면 구성

```
[뉴스 카드 목록]
  - 기업명 배지
  - 뉴스 제목
  - 날짜 (예: 2023년 3월)
  - 난이도 뱃지

[뉴스 본문 읽기 화면]
  - 뉴스 전문
  - "이 뉴스 발표 당시 주가: ₩62,400"
  - [퀴즈 시작] 버튼

[퀴즈 화면]
  - 기간 선택: 1개월 후 / 3개월 후 / 6개월 후 (순차 제시)
  - 4지선다 (주가 변동률)
  - 정답 후: 실제 변동률 공개 + 간단한 시장 해설

[결과 화면]
  - 1/3/6개월 비교 차트
  - 획득 코인
  - "다음 뉴스 보기" 버튼
```

---

## 7. 작업 분담

### 최원준 (PM / FE) — `feat/page-routing`, `feat/quiz-unlock`

- [ ] 러닝 트랙 탭 라우팅 추가 (기존 퀴즈 탭과 분리)
- [ ] 뉴스 카드 목록 UI 구현 (카테고리 배지, 난이도, 날짜 표시)
- [ ] 뉴스 본문 읽기 화면 UI
- [ ] 초기 큐레이션 뉴스 데이터 10~20개 직접 수집 및 DB 입력
- [ ] 퀴즈 잠금 해제 조건 (코인 소모 없이 러닝 트랙은 무료 개방)

### 김성준 (Backend) — `feat/news-collector`, `feat/trade-logic`

- [ ] `npm install yahoo-finance2` 및 과거 주가 조회 모듈 작성
- [ ] `GET /api/learning/news` — curated_news 목록 반환
- [ ] `GET /api/learning/quiz/:newsId` — 주가 퀴즈 데이터 생성 (선택지 자동 생성 포함)
- [ ] `stock_price_cache` 테이블 활용해 Yahoo Finance 중복 호출 방지
- [ ] 퀴즈 선택지 생성 로직 (정답 ± 오답 3개 자동 계산)

### 이은우 (DB) — `feat/db-schema`, `feat/db-sync`

- [ ] `curated_news` 테이블 생성 및 RLS 설정
- [ ] `stock_price_cache` 테이블 생성
- [ ] 기존 `quiz_sessions`, `quiz_answers` 테이블에 `track_type` 컬럼 추가 (learning / live 구분)
- [ ] Supabase seed 파일 작성 (초기 뉴스 데이터 insert용)

### 김승민A (API / FE) — `feat/news-feed-ui`, `feat/stock-price-ui`

- [ ] 러닝 트랙 퀴즈 화면 UI (1/3/6개월 순차 제시)
- [ ] 4지선다 선택지 렌더링 + 정답 공개 애니메이션
- [ ] 백엔드 API 연동 (`/api/learning/quiz/:newsId` 호출)
- [ ] 주가 변동률 결과 표시 (숫자 + 방향 색상)

### 허조영 (UI/UX) — `feat/stock-card-ui`, `feat/design-system`

- [ ] 1 / 3 / 6개월 주가 비교 결과 카드 컴포넌트 디자인
- [ ] 뉴스 카드 컴포넌트 디자인 (기업 로고, 날짜, 카테고리 배지)
- [ ] 러닝 트랙 전체 화면 흐름 디자인 시스템 통일

---

## 8. 개발 순서 (권장)

```
1단계 — DB + 백엔드 기반
  ① DB 스키마 생성
  ② yahoo-finance2로 과거 주가 조회 기능 구현
  ③ /api/learning/quiz/:newsId 엔드포인트 완성
  ④ 초기 뉴스 데이터 10개 입력

2단계 — 프론트엔드 연동
  ⑤ 러닝 트랙 탭 UI 구현
  ⑥ 뉴스 카드 목록 → 퀴즈 흐름 연결
  ⑦ 정답 공개 + 주가 변동 결과 화면

3단계 — 마무리
  ⑧ 주가 캐시 테이블 적용 (중복 Yahoo Finance 호출 방지)
  ⑨ 코인 보상 + 기록 저장 연동
  ⑩ 랭킹 탭에 러닝 트랙 점수 반영
```

---

## 9. Claude API 사용 여부

| 기능 | Claude API 필요? | 대체 방법 |
|------|-----------------|-----------|
| 퀴즈 문제 생성 | ❌ 불필요 | Yahoo Finance 데이터로 자동 생성 |
| 뉴스 신뢰도 검증 | ❌ 불필요 | 큐레이션된 뉴스만 사용 |
| 뉴스 해설 | ❌ 불필요 | 실제 주가 변동률 자체가 해설 |
| **라이브 트랙** (추후) | ✅ 필요 | 실시간 뉴스 요약 + 자동 퀴즈 생성 |

러닝 트랙은 Claude API 없이 완전히 구현 가능.  
라이브 트랙 추가 시에만 Claude API를 재활용 예정.

---

## 10. Yahoo Finance 연동 메모

```bash
# 백엔드 패키지 설치
npm install yahoo-finance2
```

```javascript
// 과거 주가 조회 예시 (Node.js)
const yahooFinance = require('yahoo-finance2').default;

async function getStockHistory(ticker, startDate, endDate) {
  const result = await yahooFinance.historical(ticker, {
    period1: startDate,  // '2023-03-15'
    period2: endDate,    // '2023-09-15'
    interval: '1d',
  });
  return result; // [{ date, open, high, low, close, volume }, ...]
}
```

티커 형식:
- 한국 주식: `005930.KS` (삼성전자), `000660.KS` (SK하이닉스)
- 국내 종목만 지원 (미장 제외)

---

## 11. 향후 라이브 트랙 (참고용)

러닝 트랙 완성 후 추가 고려:

- 오늘의 실시간 뉴스 제공 (네이버 뉴스 API)
- Claude API로 퀴즈 자동 생성 (기존 `fetchQuestions` 함수 재사용)
- 사용자가 직접 주가 예측 → 1달 후 실제 결과 알림
