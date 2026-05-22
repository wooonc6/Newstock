# 최원준 — PM/FE 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/auth-flow` | 로그인/회원가입 | ✅ 완료 |
| `feat/quiz-unlock` | 헤더 DB 연결 + 퀴즈 화면 연결 | 진행 중 |
| `feat/page-routing` | 포트폴리오 화면 완성 | 이후 |

---

## 완료된 작업 (`feat/auth-flow` 브랜치)

---

### 1. 로그인 / 회원가입

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

```ts
// 비로그인 → /login 리다이렉트
if (!user && isProtected) {
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// 로그인 상태에서 /login 접근 → /dashboard 리다이렉트
if (user && isAuthPage) {
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}
```

---

### 3. 전역 인증 상태

**파일: `src/context/AuthContext.tsx`**

앱 전체에서 `useAuth()` 훅으로 로그인 상태 조회 가능.

```tsx
// 어느 컴포넌트에서든 사용 가능
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

**파일: `src/components/layout/Header.tsx`**

닉네임, 코인, 스트릭, 로그아웃 버튼 표시. 현재 코인·스트릭은 props로 받는 구조 (DB 연동 필요).

```tsx
<Header nickname={nickname} coins={coins} streak={streak} onLogout={signOut} />
```

**파일: `src/components/layout/NavTabs.tsx`**

퀴즈 / 모의투자 / 랭킹 / 기록 / 분석 5개 탭. 현재 경로 기반으로 활성 탭 자동 표시.

```tsx
const TABS = [
  { href: "/dashboard", label: "📰 퀴즈" },
  { href: "/portfolio",  label: "📈 모의투자" },
  { href: "/ranking",    label: "🏆 랭킹" },
  { href: "/history",    label: "📋 기록" },
  { href: "/stats",      label: "📊 분석" },
];
```

---

### 6. 대시보드 + 퀴즈 언락 UI

**파일: `src/app/(main)/dashboard/DashboardClient.tsx`**

Supabase의 `quiz_sessions` 테이블에서 종목별 완료 퀴즈 수를 조회해 언락 상태를 계산.  
3문제 완료 시 해당 종목 잠금 해제.

```tsx
// 언락 상태 조회 훅
const { unlockMap, loading } = useQuizUnlock(user?.id);

// 언락 판정 (hooks/useQuizUnlock.ts)
// quiz_sessions에서 stock_ticker별 완료 수 집계
// quizzes_completed >= 3 → unlocked: true
```

종목 카드(`StockQuizCard`)에 진행률 바, 잠금/해제 상태, 실시간 주가 표시.

---

## 남은 작업

### 1. 헤더 DB 연결 (이은우 완료 후)

파일: `src/components/layout/Header.tsx`

코인 수, 스트릭 → `users` 테이블에서 실제 값 불러오도록 수정  
현재는 UI만 있고 DB 연동 안 된 상태

---

### 2. 퀴즈 화면 연결 (김성준 완료 후)

파일: `src/app/(main)/quiz/[stock]/page.tsx`

- 김성준의 뉴스 수집 API 연결
- 채점 API 연결
- 김승민A의 퀴즈 UI 컴포넌트 연결

---

### 3. 포트폴리오 화면 완성 (김성준 완료 후)

파일: `src/app/(main)/portfolio/page.tsx`

- 매수/매도 거래 API 연결
- 실시간 야후 주가 기반 수익률 표시

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

---

### 1. 현재 작업 중인 브랜치 확인

```bash
# 터미널에서 Newstock 폴더 안에 있는지 확인
# (터미널 경로에 ...\Newstock 이 보여야 함)

# 현재 브랜치 확인
git branch
```

---

### 2. `feat/quiz-unlock` 작업 (이은우 완료 후)

```bash
# 최신 코드 받기
git checkout main
git pull origin main

# 브랜치 전환 (이미 있으므로 -b 없이)
git checkout feat/quiz-unlock

# 개발 서버 실행
npm run dev
```

`src/components/layout/Header.tsx` 수정 후:

```bash
git add .
git commit -m "feat: 헤더 코인/스트릭 DB 연결"
git push origin feat/quiz-unlock
```

---

### 3. `feat/page-routing` 작업 (김성준 완료 후)

```bash
git checkout main
git pull origin main
git checkout feat/page-routing

npm run dev
```

`src/app/(main)/portfolio/page.tsx` 수정 후:

```bash
git add .
git commit -m "feat: 포트폴리오 화면 거래 API 연결"
git push origin feat/page-routing
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

> ⚠️ `main`에 직접 push 금지

---

## GitHub 브랜치 읽는 법

**https://github.com/wooonc6/Newstock/tree/feat/quiz-unlock** 접속하면 아래처럼 보임.

```
feat/quiz-unlock ▼   17 Branches

This branch is 28 commits behind main.          ← ① 정상. 의도적인 것
                                      [Contribute ▼]

wooonc6 and claude  feat: 종목별 퀴즈 언락 UI 구현   🕐 3 Commits   ← ②

📁 src/                feat: 종목별 퀴즈 언락 UI 구현   last week   ← ③
📄 .gitignore          Initial commit: Newstock...    2 weeks ago
```

**① "X commits behind main"**
→ main에 더 많은 커밋이 있다는 뜻. **문제 아님.** 이 브랜치엔 퀴즈 언락 관련 커밋만 있으면 됨.
→ 추가 작업(헤더 DB 연결 등) 커밋하면 숫자가 줄어들거나, PR 올리면 해소됨.

**② 커밋 수 + 마지막 커밋 메시지**
→ 이 브랜치에 총 몇 개 커밋이 있는지, 가장 최근 커밋이 뭔지.

**③ 파일/폴더 목록 + 마지막으로 수정한 커밋**
→ 각 파일이 어느 커밋에서 바뀌었는지.
→ `src` → `components` → `layout` → `Header.tsx` 클릭하면 현재 코드 바로 확인 가능.

---

### 이 프로젝트 폴더 구조 (PM/FE 담당 관련)

```
Newstock/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/page.tsx          → /login 페이지 (완료)
    │   └── (main)/
    │       ├── dashboard/
    │       │   ├── page.tsx            → /dashboard (완료)
    │       │   └── DashboardClient.tsx → 퀴즈 언락 UI (완료)
    │       ├── quiz/[stock]/page.tsx   → /quiz/삼성전자 등 (연결 작업 필요)
    │       └── portfolio/page.tsx      → /portfolio (거래 API 연결 필요)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx              → 헤더 (DB 연결 필요)
    │   │   └── NavTabs.tsx             → 하단 탭바 (완료)
    │   └── quiz/
    │       └── StockQuizCard.tsx       → 종목 카드 (완료)
    ├── context/AuthContext.tsx         → 로그인 상태 전역 관리 (완료)
    ├── hooks/useQuizUnlock.ts          → 언락 상태 조회 훅 (완료)
    └── middleware.ts                   → 비로그인 차단 (완료)
```
