# 최원준 — PM/FE 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/auth-flow` | 로그인/회원가입 | ✅ 완료 |
| `feat/quiz-unlock` | 헤더 DB 연결 + 퀴즈 화면 연결 | 진행 중 |
| `feat/page-routing` | 포트폴리오 화면 완성 | 이후 |

---

## 완료된 작업 (건드리지 않아도 됨)

- 로그인 / 회원가입
- 인증 미들웨어
- 전체 페이지 라우팅
- 대시보드 + 퀴즈 언락 UI
- 헤더 / 네비게이션

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

### 작업 시작

```bash
git checkout dev
git pull origin dev
git checkout -b feat/quiz-unlock   # 또는 feat/page-routing
```

### 작업 후 올리기

```bash
git add .
git commit -m "feat: 헤더 코인/스트릭 DB 연결"
git push origin feat/quiz-unlock
```

### PR 올리기

1. https://github.com/wooonc6/Newstock 접속
2. **"Compare & pull request"** 클릭
3. base 브랜치 → `dev` 확인 후 PR 생성

> ⚠️ `main`에 직접 push 금지
