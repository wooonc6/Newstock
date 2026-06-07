# 최원준 — PM/FE 담당

## 담당 작업

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/auth-flow` | 로그인/회원가입/비밀번호찾기 | ✅ 완료 |
| `feat/quiz-unlock` | 헤더 DB 연결 + 퀴즈 화면 연결 | 이은우 + 김성준 완료 후 |
| `feat/page-routing` | 포트폴리오 화면 완성 | 김성준 완료 후 |

---

## 완료된 작업

### 1. 로그인 / 회원가입 / 비밀번호 찾기

**파일: `src/components/auth/AuthForm.tsx`**

Supabase Auth 기반 이메일/비밀번호 로그인 + 회원가입. 닉네임은 회원가입 시 `user_metadata`에 저장.

```tsx
// 로그인
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (!error) router.push("/dashboard");

// 회원가입 (닉네임 포함)
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { nickname: nickname.trim() } },
});
```

---

### 2. 인증 미들웨어

**파일: `src/middleware.ts`**

비로그인 사용자가 보호된 페이지 접근 시 `/login`으로 리다이렉트.  
로그인된 사용자가 `/login` 접근 시 `/dashboard`로 리다이렉트.

---

### 3. 전역 인증 상태

**파일: `src/context/AuthContext.tsx`**

앱 전체에서 `useAuth()` 훅으로 로그인 상태 조회 가능.

```tsx
const { user, session, loading, signOut } = useAuth();
```

---

### 4. 전체 페이지 라우팅

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `src/app/page.tsx` | `/dashboard`로 리다이렉트 |
| `/login` | `src/app/(auth)/login/page.tsx` | 로그인/회원가입 |
| `/dashboard` | `src/app/(main)/dashboard/page.tsx` | 종목 퀴즈 대시보드 |
| `/quiz/[stock]` | `src/app/(main)/quiz/[stock]/page.tsx` | 종목별 퀴즈 |
| `/portfolio` | `src/app/(main)/portfolio/page.tsx` | 모의투자 (미완성) |
| `/ranking` | `src/app/(main)/ranking/page.tsx` | 랭킹 (미완성) |
| `/history` | `src/app/(main)/history/page.tsx` | 퀴즈 기록 (미완성) |
| `/stats` | `src/app/(main)/stats/page.tsx` | 분석 (미완성) |

---

### 5. 헤더 / 네비게이션

닉네임, 코인, 스트릭, 로그아웃 버튼 표시.  
현재 코인·스트릭은 하드코딩 상태 → DB 연동 필요

---

### 6. 대시보드 + 퀴즈 언락 UI

Supabase `quiz_sessions` 테이블에서 종목별 완료 퀴즈 수를 조회해 언락 상태 계산.  
3번 퀴즈 완료 시 해당 종목 잠금 해제.

---

### 7. 뉴스 + 퀴즈 API (이미 완료)

| API | 경로 | 상태 |
|-----|------|------|
| 주가 조회 | `GET /api/stocks/[ticker]` | ✅ |
| 뉴스 목록 | `GET /api/learning/news?ticker=xxx` | ✅ |
| 뉴스 상세 | `GET /api/learning/news/[id]` | ✅ |
| 퀴즈 문제 | `GET /api/learning/quiz/[newsId]` | ✅ |

---

## 남은 작업

### 1. 헤더 DB 연결 (이은우 완료 후)

파일: `src/components/layout/Header.tsx`

코인 수, 스트릭 → `users` 테이블에서 실제 값 불러오도록 수정

```tsx
// src/components/layout/Header.tsx (예시)
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const supabase = createClient()
const { user } = useAuth()

const { data: userData } = await supabase
  .from('users')
  .select('nickname, coins, streak')
  .eq('id', user?.id)
  .single()
```

---

### 2. 퀴즈 화면 연결 (이은우 DB + 김성준 채점 API 완료 후)

파일: `src/app/(main)/quiz/[stock]/page.tsx`

현재 플레이스홀더 → 실제 동작으로 교체:
- `/api/learning/news?ticker={ticker}` 호출해서 뉴스 목록 표시
- `/api/learning/quiz/[newsId]` 호출해서 퀴즈 문제 표시
- `/api/quiz/submit` 호출해서 채점 결과 표시

---

### 3. 포트폴리오 화면 완성 (김성준 완료 후)

파일: `src/app/(main)/portfolio/page.tsx`

- Supabase에서 `portfolio`, `trades` 테이블 데이터 조회
- 종목별 수익률 표시 (현재 야후 주가 vs avg_cost)
- 매수/매도 버튼 → `/api/trade` 연결

---

## 이 프로젝트 폴더 구조 (PM/FE 담당 관련)

```
Newstock/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/page.tsx              → /login 페이지 (완료)
    │   └── (main)/
    │       ├── dashboard/
    │       │   ├── page.tsx                → /dashboard (완료)
    │       │   └── DashboardClient.tsx     → 퀴즈 언락 UI (완료)
    │       ├── quiz/[stock]/page.tsx       → /quiz/xxx (연결 작업 필요)
    │       └── portfolio/page.tsx          → /portfolio (거래 API 연결 필요)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx                  → 헤더 (DB 연결 필요)
    │   │   └── NavTabs.tsx                 → 하단 탭바 (완료)
    │   └── quiz/
    │       └── StockQuizCard.tsx           → 종목 카드 (완료)
    ├── context/AuthContext.tsx             → 로그인 상태 전역 관리 (완료)
    ├── hooks/useQuizUnlock.ts              → 언락 상태 조회 훅 (완료)
    └── middleware.ts                       → 비로그인 차단 (완료)
```

---

## GitHub에 올리는 방법

```bash
# 최신 코드 받기
git checkout main
git pull origin main

# 작업 후 main push → Vercel 자동 배포
npm run build
git add .
git commit -m "feat: 작업 내용 설명"
git push origin main
```
