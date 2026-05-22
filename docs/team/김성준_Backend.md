# 김성준 — Backend 담당

**브랜치: `feat/news-collector` → `feat/unlock-backend` → `feat/trade-logic`**

---

## 1. 뉴스 수집 + 퀴즈 문제 생성 (`feat/news-collector`)

```
GET /api/news/collect?ticker=005930.KS&period=1m

흐름:
네이버 뉴스 API → 1개월 전 종목 관련 뉴스 수집
→ yahoo-finance2로 뉴스 날짜(D), 다음날(D+1) 종가 조회
→ price_before vs price_after 비교 → answer = 'up' | 'down' 자동 판정
→ quiz_questions 테이블 저장
```

**참고**
- 네이버 뉴스 API 키: `.env.local`의 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- 야후 주가 조회: `yahoo-finance2` 라이브러리 (`/src/app/api/stocks/[ticker]/route.ts` 참고)
- Claude API 불필요 — 뉴스 + 주가 데이터만으로 정답 자동 판정

---

## 2. 퀴즈 채점 + 코인 지급 (`feat/unlock-backend`)

```
POST /api/quiz/submit
body: { question_id, user_answer: 'up' | 'down' }

흐름:
정답 확인 → quiz_sessions 저장
→ 해당 종목 3문제 통과 시 투자 권한 해제
→ 정답 시 users.coins 증가
```

---

## 3. 매수/매도 처리 (`feat/trade-logic`)

```
POST /api/trade
body: { ticker, type: 'buy' | 'sell', quantity }

흐름:
현재 야후 주가 조회 → users.coins 차감/증가
→ portfolio, trades 테이블 업데이트
```
