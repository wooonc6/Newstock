# 김성준 — Backend 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/news-collector` | 네이버 뉴스 수집 + 퀴즈 문제 생성 API | 1번 |
| `feat/unlock-backend` | 퀴즈 채점 + 코인 지급 | 2번 |
| `feat/trade-logic` | 매수/매도 처리 | 3번 |

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
- 야후 주가 조회: `yahoo-finance2` 라이브러리 (`src/app/api/stocks/[ticker]/route.ts` 참고)
- Claude API 불필요 — 뉴스 + 주가 데이터만으로 정답 자동 판정

**만들어야 할 파일**: `src/app/api/news/collect/route.ts`

```ts
// 대략적인 구조
import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')  // 예: '005930.KS'
  const period = req.nextUrl.searchParams.get('period')  // 예: '1m'

  // 1. 네이버 뉴스 API 호출
  // 2. 야후 주가 조회 (yahooFinance.historical)
  // 3. 정답 판정 후 quiz_questions 테이블에 insert
}
```

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

**만들어야 할 파일**: `src/app/api/quiz/submit/route.ts`

---

## 3. 매수/매도 처리 (`feat/trade-logic`)

```
POST /api/trade
body: { ticker, type: 'buy' | 'sell', quantity }

흐름:
현재 야후 주가 조회 → users.coins 차감/증가
→ portfolio, trades 테이블 업데이트
```

**만들어야 할 파일**: `src/app/api/trade/route.ts`

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. 상단 메뉴 **Terminal → New Terminal** 클릭
3. 또는 단축키 **Ctrl + `** (백틱, 숫자 1 왼쪽 키)
4. 하단에 터미널 창이 열림

**방법 B — Windows 터미널 직접 사용**
1. 시작 메뉴에서 **"PowerShell"** 검색 후 실행

> 💡 VS Code에서 작업하면 코드 편집 + 터미널을 한 화면에서 할 수 있어서 편함

---

### 1. 처음 한 번만 — 레포 클론

> 이미 받았다면 건너뜀

```bash
# 원하는 폴더로 이동 (예: 바탕화면)
cd Desktop

# 레포 다운로드
git clone https://github.com/wooonc6/Newstock.git

# 프로젝트 폴더로 이동
cd Newstock

# 패키지 설치
npm install
```

### 환경변수 설정 (처음 한 번)

```bash
# .env.local 파일 생성 (.env.example 복사)
copy .env.example .env.local
```

VS Code에서 `.env.local` 파일 열고 아래 항목 채우기:
```
NAVER_CLIENT_ID=여기에_네이버_클라이언트_ID
NAVER_CLIENT_SECRET=여기에_네이버_클라이언트_시크릿
SUPABASE_URL=이은우한테_받은_URL
SUPABASE_ANON_KEY=이은우한테_받은_KEY
```

> 네이버 API 키: https://developers.naver.com → 애플리케이션 등록 → 검색 API

---

### 2. 첫 번째 브랜치 작업 (`feat/news-collector`)

```bash
# 터미널에서 Newstock 폴더 안에 있는지 확인

# 최신 코드 받기
git checkout main
git pull origin main

# 내 브랜치 만들기
git checkout -b feat/news-collector
```

코드 작성 후:

```bash
# 로컬에서 테스트
npm run dev
# 브라우저에서 http://localhost:3000/api/news/collect?ticker=005930.KS&period=1m 확인

# GitHub에 올리기
git add .
git commit -m "feat: 네이버 뉴스 수집 및 퀴즈 문제 생성 API"
git push origin feat/news-collector
```

---

### 3. 두 번째/세 번째 브랜치

```bash
# 두 번째 브랜치
git checkout main
git pull origin main
git checkout -b feat/unlock-backend
# 작업 후
git add .
git commit -m "feat: 퀴즈 채점 및 코인 지급 API"
git push origin feat/unlock-backend

# 세 번째 브랜치
git checkout main
git pull origin main
git checkout -b feat/trade-logic
# 작업 후
git add .
git commit -m "feat: 매수/매도 처리 API"
git push origin feat/trade-logic
```

---

### 4. PR(Pull Request) 올리기

> push 완료 후 GitHub 웹사이트에서 진행

1. 브라우저에서 **https://github.com/wooonc6/Newstock** 접속
2. 노란색 배너 **"Compare & pull request"** 버튼 클릭
   - 안 보이면 상단 **"Pull requests"** 탭 → **"New pull request"**
3. **base 브랜치**: `dev` 로 설정 (중요! `main` 아님)
4. **compare 브랜치**: 내가 올린 브랜치 확인
5. 제목 입력 후 **"Create pull request"** 클릭
6. 최원준에게 카톡으로 PR 링크 전달

> ⚠️ `main`에 직접 push 금지

---

### 완료 확인 체크리스트

- [ ] `.env.local`에 네이버 API 키 + Supabase 키 입력
- [ ] `npm run dev` 실행 후 API 테스트 완료
- [ ] `feat/news-collector` push + PR 완료
- [ ] `feat/unlock-backend` push + PR 완료
- [ ] `feat/trade-logic` push + PR 완료
