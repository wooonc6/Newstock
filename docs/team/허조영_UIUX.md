# 허조영 — UI/UX 담당

## 담당 작업

| 담당 영역 | 작업 내용 | 주로 수정할 위치 | 순서 |
|----------|----------|----------------|------|
| 디자인 시스템 | 공통 UI 컴포넌트 제작 | `src/components/ui`, `src/app/globals.css` | 1번 |
| 종목 카드 UI | 종목 카드 UI 개선 | `src/components/quiz/StockQuizCard.tsx` | 2번 |
| 온보딩 UI | 온보딩 화면 구현 | `src/app/(main)/onboarding` | 3번 |

> 브랜치는 나누지 않고 `main` 브랜치에서 직접 작업합니다.

> 디자인 레퍼런스: `reference/design_reference.html` 브라우저로 열면 전체 디자인 확인 가능  
> 담당 화면 CSS/구조 보고 `.tsx` 컴포넌트로 변환하면 됩니다.

---

## 1. 공통 컴포넌트

`src/components/ui/` 폴더를 새로 만들고 아래 파일들 생성:

| 파일 | 내용 |
|------|------|
| `Button.tsx` | primary / outline / danger 변형 |
| `Badge.tsx` | 섹터 배지, 랭킹 메달 |
| `Card.tsx` | 공통 카드 래퍼 |
| `Toast.tsx` | 토스트 알림 |

### CSS 변수 추가

`src/app/globals.css`에 아래 변수 추가 또는 기존 변수 업데이트:

```css
:root {
  --accent: #00e5b0;
  --accent2: #3b82f6;
  --bg: #080d17;
  --surface: #0f1724;
  --surface2: #162033;
  --border: rgba(255,255,255,0.08);
  --text: #e8edf5;
  --text-dim: #8fa3b8;
  --text-muted: #4a6070;
  --warn: #f59e0b;
  --danger: #ef4444;
}
```

### 컴포넌트 예시 구조

```tsx
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'danger'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export default function Button({ variant = 'primary', children, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
```

---

## 2. 카드 UI 개선

파일: `src/components/quiz/StockQuizCard.tsx`

개선할 것:

- 퀴즈 통과 시 잠금 해제 애니메이션
- 모바일 화면에서 레이아웃 깨지지 않는지 확인

애니메이션 예시:

```css
@keyframes unlock {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) rotate(-10deg); }
  100% { transform: scale(1); }
}

.unlock-anim {
  animation: unlock 0.5s ease;
}
```

---

## 3. 온보딩 화면

만들어야 할 파일: `src/app/(main)/onboarding/page.tsx`

첫 로그인 시 또는 `/onboarding` URL로 접근 시 표시:

```text
┌─────────────────────────────────────┐
│           Newstock                  │
│   뉴스로 배우는 모의 주식 투자       │
│                                     │
│  1단계  📰 뉴스 읽기                │
│  2단계  🎯 퀴즈 풀기                │
│  3단계  📈 투자하기                 │
│                                     │
│         [시작하기 →]                 │
└─────────────────────────────────────┘
```

시작하기 버튼 클릭 시 `/dashboard`로 이동.

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

### 3. 개발 서버 실행 + 실시간 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속해서 내가 만든 컴포넌트를 확인합니다.

### 4. main에서 작업하고 push

브랜치를 따로 만들지 않고 `main`에서 작업합니다.

```bash
git checkout main
git pull origin main

# 작업 중 확인
npm run dev

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
| 공통 UI 컴포넌트 | `src/components/ui` |
| 기존 종목 카드 수정 | `src/components/quiz/StockQuizCard.tsx` |
| 온보딩 페이지 | `src/app/(main)/onboarding/page.tsx` |
| 전역 CSS | `src/app/globals.css` |
| 이미지 / 정적 파일 | `public` |
| 디자인 참고자료 | `reference` |
| 실제 환경변수 파일 `.env.local` | GitHub에 올리지 않음 |

---

## 이 프로젝트 폴더 구조 (UI/UX 담당 관련)

```text
Newstock/
├── src/
│   ├── app/
│   │   ├── globals.css             ← CSS 변수 추가 위치
│   │   └── (main)/
│   │       └── onboarding/
│   │           └── page.tsx        ← 온보딩 화면
│   └── components/
│       ├── ui/                     ← 공통 UI 컴포넌트
│       │   ├── Button.tsx
│       │   ├── Badge.tsx
│       │   ├── Card.tsx
│       │   └── Toast.tsx
│       └── quiz/
│           └── StockQuizCard.tsx   ← 언락 애니메이션 수정 대상
└── reference/
    └── design_reference.html       ← 디자인 참고용
```

> `src/components/ui/`는 없는 폴더라면 VS Code에서 직접 만들면 됩니다.

---

## 완료 확인 체크리스트

- [ ] `globals.css`에 CSS 변수 추가 완료
- [ ] `src/components/ui/` 폴더 생성
- [ ] Button, Badge, Card, Toast 컴포넌트 4개 구현
- [ ] 디자인 시스템 작업 main push 완료
- [ ] 종목 카드 언락 애니메이션 추가
- [ ] 모바일 레이아웃 점검
- [ ] 종목 카드 UI 작업 main push 완료
- [ ] 온보딩 화면 구현
- [ ] 온보딩 UI 작업 main push 완료
- [ ] 최원준에게 완료 알림
