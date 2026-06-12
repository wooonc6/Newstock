# 김승민A — API/FE 담당

## 담당 작업

| 담당 영역 | 작업 내용 | 주로 수정할 위치 | 순서 |
|----------|----------|----------------|------|
| 퀴즈 화면 UI | 퀴즈 화면 뉴스 피드 UI 구현 | `src/app/(main)/quiz`, `src/components` | 1번 |
| 랭킹 UI | 랭킹 페이지 구현 | `src/app/(main)/ranking`, `src/components` | 2번 |

> 브랜치는 나누지 않고 `main` 브랜치에서 직접 작업합니다.

> ✅ yahoo-finance2 빌드 에러는 이미 수정됨 — 바로 UI 작업 시작 가능!

---

## 1. 퀴즈 화면 UI

파일: `src/app/(main)/quiz/[stock]/page.tsx`

현재 상태: 플레이스홀더만 있음 → 실제 뉴스/퀴즈 UI로 교체

### 구현 순서

**Step 1 — 뉴스 목록 불러오기**

```ts
GET /api/learning/news?ticker=005930.KS
```

**Step 2 — 퀴즈 문제 불러오기**

뉴스 하나를 클릭하면 퀴즈 문제 조회:

```ts
GET /api/learning/quiz/{newsId}
```

**Step 3 — 화면 구성**

```text
[뉴스 목록 화면]
┌─────────────────────────────┐
│ 📰 삼성전자 HBM3 양산 성공…  │ ← 클릭
│ 2024.01.15  IT  쉬움        │
└─────────────────────────────┘

[퀴즈 화면]
┌─────────────────────────────────────────┐
│ 삼성전자  2024.01.15                    │
│ "삼성전자, HBM3 양산 성공…"             │
│ 이 뉴스가 나온 후 1개월 뒤 주가는?       │
│ ○ +2.5%    ○ +8.3%                      │
│ ○ +5.1%    ○ -3.2%                      │
│ [다음 →]   코인 +10                     │
└─────────────────────────────────────────┘
```

**Step 4 — 채점 API 연동**

```ts
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

## 2. 랭킹 페이지

파일: `src/app/(main)/ranking/page.tsx`

### 구현 내용

- 코인 또는 포트폴리오 수익률 기준 전체 순위
- 1~3위 🥇🥈🥉 메달 표시
- 내 순위 강조 표시

### 데이터 조회 방법

```ts
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const { data } = await supabase
  .from('users')
  .select('id, nickname, coins')
  .order('coins', { ascending: false })
  .limit(50)
```

### 화면 예시

```text
🏆 코인 랭킹

🥇 1위   김성준    1,250,000 코인
🥈 2위   이은우    1,180,000 코인
🥉 3위   허조영    1,050,000 코인
    4위   김승민A   980,000 코인   ← 내 순위 강조
```

> 디자인: `reference/design_reference.html` 랭킹 탭 참고

---

## GitHub에 올리는 방법

### 1. 처음 한 번만 — 레포 클론

```bash
cd Desktop
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고, 팀 내부 공유 채널에서 받은 실제 값을 입력합니다.

```bash
copy .env.example .env.local
```

> `.env.local`은 GitHub에 올리지 않습니다.

### 3. 개발 서버 실행 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 에러 없이 뜨면 OK.

### 4. main에서 작업하고 push

브랜치를 따로 만들지 않고 `main`에서 작업합니다.

```bash
git checkout main
git pull origin main

# 작업 후
npm run build
git add .
git commit -m "feat: 작업 내용 설명"
git push origin main
```

push한 뒤 Vercel 배포와 실제 화면을 확인합니다.

---

## 파일 위치 규칙

| 파일 종류 | 올릴 위치 |
|----------|----------|
| 퀴즈 페이지 | `src/app/(main)/quiz/[stock]/page.tsx` |
| 랭킹 페이지 | `src/app/(main)/ranking/page.tsx` |
| 재사용 UI 컴포넌트 | `src/components` |
| 공통 함수, Supabase 연결 코드 | `src/lib` |
| 디자인 참고자료 | `reference` |
| 실제 환경변수 파일 `.env.local` | GitHub에 올리지 않음 |

---

## 이 프로젝트 폴더 구조

```text
Newstock/
├── src/
│   └── app/
│       └── (main)/
│           ├── quiz/
│           │   └── [stock]/
│           │       └── page.tsx    ← 퀴즈 화면 UI
│           └── ranking/
│               └── page.tsx        ← 랭킹 페이지
├── src/components/                ← 재사용 컴포넌트
└── reference/
    └── design_reference.html       ← 디자인 참고용
```

> `(main)` 괄호 폴더는 URL에 안 나타납니다. `/quiz/005930.KS`, `/ranking` 이런 식으로 접근됩니다.

---

## 완료 확인 체크리스트

- [ ] `npm run dev` 에러 없이 실행 확인
- [ ] 퀴즈 화면: 뉴스 목록 표시
- [ ] 퀴즈 화면: 보기 4개 + 정답 확인 기능
- [ ] 퀴즈 UI 작업 main push 완료
- [ ] 랭킹 페이지: 코인 순위 목록 표시
- [ ] 랭킹 페이지: 내 순위 강조
- [ ] 랭킹 UI 작업 main push 완료
- [ ] 최원준에게 완료 알림
