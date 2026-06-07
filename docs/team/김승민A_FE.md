# 김승민A — API/FE 담당

## 담당 작업

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/news-feed-ui` | 퀴즈 화면 뉴스 피드 UI 구현 | 1번 |
| `feat/ranking-ui` | 랭킹 페이지 구현 | 2번 |

> ✅ yahoo-finance2 빌드 에러는 이미 수정됨 — 바로 UI 작업 시작 가능!

---

## 1. 퀴즈 화면 UI (`feat/news-feed-ui`)

파일: `src/app/(main)/quiz/[stock]/page.tsx`

현재 상태: 플레이스홀더만 있음 → 실제 뉴스/퀴즈 UI로 교체

### 구현 순서

**Step 1 — 뉴스 목록 불러오기**

```ts
// 종목별 뉴스 목록 조회
GET /api/learning/news?ticker=005930.KS

// 응답 예시
[
  {
    id: "uuid",
    title: "삼성전자, HBM3 양산 성공… 엔비디아에 공급 임박",
    company: "삼성전자",
    ticker: "005930.KS",
    news_date: "2024-01-15",
    category: "IT",
    difficulty: "easy"
  },
  ...
]
```

**Step 2 — 퀴즈 문제 불러오기**

뉴스 하나를 클릭하면 퀴즈 문제 조회:

```ts
GET /api/learning/quiz/{newsId}

// 응답 예시
{
  newsId: "uuid",
  company: "삼성전자",
  ticker: "005930.KS",
  newsDate: "2024-01-15",
  headline: "삼성전자, HBM3 양산 성공…",
  periods: [
    {
      label: "1개월 후",
      months: 1,
      priceBase: 72000,
      priceEnd: 78000,
      changeRate: 8.33,
      direction: "up",
      options: ["+2.5%", "+8.3%", "+5.1%", "-3.2%"],  // 섞인 보기
      answerIndex: 1,
      coins: 10
    },
    { label: "3개월 후", months: 3, ..., coins: 20 },
    { label: "6개월 후", months: 6, ..., coins: 30 }
  ]
}
```

**Step 3 — 화면 구성**

```
[뉴스 목록 화면]
┌─────────────────────────────┐
│ 📰 삼성전자 HBM3 양산 성공…  │ ← 클릭
│ 2024.01.15  IT  쉬움        │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 📰 삼성전자 4분기 영업이익…  │
│ 2024.01.09  IT  보통        │
└─────────────────────────────┘

[퀴즈 화면]
┌─────────────────────────────────────────┐
│ 삼성전자  2024.01.15                    │
│ "삼성전자, HBM3 양산 성공…"             │
│                                         │
│ 이 뉴스가 나온 후 1개월 뒤 주가는?     │
│                                         │
│ ○ +2.5%    ○ +8.3%                     │
│ ○ +5.1%    ○ -3.2%                     │
│                                         │
│ [다음 →]   코인 +10                     │
└─────────────────────────────────────────┘
```

**Step 4 — 채점 API 연동 (김성준 완료 후)**

```ts
// 퀴즈 제출
POST /api/quiz/submit
body: {
  news_id: "uuid",
  stock_ticker: "005930.KS",
  answers: [
    { months: 1, selected_index: 1 },
    { months: 3, selected_index: 0 },
    { months: 6, selected_index: 2 }
  ]
}
```

> 디자인: `reference/design_reference.html` 퀴즈 탭 참고

---

## 2. 랭킹 페이지 (`feat/ranking-ui`)

파일: `src/app/(main)/ranking/page.tsx`

현재 상태: 플레이스홀더만 있음

### 구현 내용

- 포트폴리오 수익률 기준 전체 순위
- 1~3위 🥇🥈🥉 메달 표시
- 내 순위 강조 표시

### 데이터 조회 방법

```ts
// Supabase에서 users 테이블과 portfolio 조인
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 코인 많은 순으로 상위 50명 조회
const { data } = await supabase
  .from('users')
  .select('id, nickname, coins')
  .order('coins', { ascending: false })
  .limit(50)
```

### 화면 예시

```
🏆 코인 랭킹

🥇 1위   김성준    1,250,000 코인
🥈 2위   이은우    1,180,000 코인
🥉 3위   허조영    1,050,000 코인
    4위   김승민A   980,000 코인   ← 내 순위 강조 (배경색 다르게)
    5위   최원준    920,000 코인
```

> 디자인: `reference/design_reference.html` 랭킹 탭 참고

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. **Terminal → New Terminal** (또는 `Ctrl + \``)

**방법 B — Windows PowerShell**
1. 시작 메뉴 → "PowerShell" 검색

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

### 2. 개발 서버 실행 확인

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속 → 에러 없이 뜨면 OK!

---

### 3. 첫 번째 브랜치 작업

```bash
git checkout main
git pull origin main
# 작업 후
npm run build
git add .
git commit -m "feat: 퀴즈 뉴스 피드 UI 구현"
git push origin main
```

push한 뒤 Vercel 배포와 실제 화면을 확인합니다.

---

### 4. 두 번째 브랜치 작업

```bash
git checkout main
git pull origin main

npm run build
git add .
git commit -m "feat: 랭킹 페이지 구현"
git push origin main
```

---

## 디자인 레퍼런스 여는 방법

`reference/design_reference.html` 파일을 **파일 탐색기에서 더블클릭** → 크롬/엣지 브라우저에서 열림.  
퀴즈/랭킹 탭 클릭해서 디자인 확인 후 그대로 구현.

---

## 이 프로젝트 폴더 구조

```
Newstock/
├── src/
│   └── app/
│       └── (main)/                 ← 로그인 후 보이는 화면들
│           ├── quiz/
│           │   └── [stock]/
│           │       └── page.tsx    ← 내가 수정할 파일 (퀴즈 화면 UI)
│           └── ranking/
│               └── page.tsx        ← 내가 수정할 파일 (랭킹 페이지)
└── reference/
    └── design_reference.html       ← 디자인 참고용 (브라우저로 열기)
```

> `(main)` 괄호 폴더는 URL에 안 나타남. `/quiz/삼성전자`, `/ranking` 이런 식으로 접근됨.

---

## 완료 확인 체크리스트

- [ ] `npm run dev` 에러 없이 실행 확인 (이미 수정됨 ✅)
- [ ] 이은우 DB 완료 확인 후 퀴즈 UI 작업 시작
- [ ] 퀴즈 화면: 뉴스 목록 표시
- [ ] 퀴즈 화면: 보기 4개 + 정답 확인 기능
- [ ] 뉴스 피드 UI 작업 main push 완료
- [ ] 랭킹 페이지: 코인 순위 목록 표시
- [ ] 랭킹 페이지: 내 순위 강조
- [ ] 랭킹 UI 작업 main push 완료
- [ ] 최원준에게 완료 알림
