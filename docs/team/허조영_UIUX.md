# 허조영 — UI/UX 담당

## 담당 작업

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/design-system` | 공통 UI 컴포넌트 제작 | 1번 |
| `feat/stock-card-ui` | 종목 카드 UI 개선 | 2번 |
| `feat/onboarding-ui` | 온보딩 화면 | 3번 |

> 이은우와 동시에 시작 가능 — 지금 바로 작업 시작하세요!

> 디자인 레퍼런스: `reference/design_reference.html` 브라우저로 열면 전체 디자인 확인 가능  
> 담당 화면 CSS/구조 보고 `.tsx` 컴포넌트로 변환하면 됩니다

---

## 1. 공통 컴포넌트 (`feat/design-system`)

`src/components/ui/` 폴더를 새로 만들고 아래 파일들 생성:

| 파일 | 내용 |
|------|------|
| `Button.tsx` | primary / outline / danger 변형 |
| `Badge.tsx` | 섹터 배지, 랭킹 메달 |
| `Card.tsx` | 공통 카드 래퍼 |
| `Toast.tsx` | 토스트 알림 |

### CSS 변수 추가

`src/app/globals.css`에 아래 변수 추가 (이미 `--accent` 등이 있다면 업데이트):

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
  const styles = {
    primary: { background: 'var(--accent)', color: '#000', border: 'none' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  )
}
```

```tsx
// src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  )
}
```

---

## 2. 카드 UI 개선 (`feat/stock-card-ui`)

파일: `src/components/quiz/StockQuizCard.tsx`

현재 파일을 열어보면 이미 기본 카드가 구현되어 있어요. 여기에 개선을 추가:

**추가할 것:**
- 퀴즈 통과 시 잠금 해제 애니메이션 (자물쇠 → 체크 전환)
- 모바일 화면에서 레이아웃 깨지지 않는지 확인

**애니메이션 힌트:**
```css
/* globals.css에 추가 */
@keyframes unlock {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) rotate(-10deg); }
  100% { transform: scale(1); }
}

.unlock-anim {
  animation: unlock 0.5s ease;
}
```

```tsx
// StockQuizCard.tsx에서 unlocked 상태 변경 시 애니메이션 트리거
const [justUnlocked, setJustUnlocked] = useState(false)
// ...
<span className={justUnlocked ? 'unlock-anim' : ''}>
  {unlocked ? '→' : '🔒'}
</span>
```

---

## 3. 온보딩 화면 (`feat/onboarding-ui`)

만들어야 할 파일: `src/app/(main)/onboarding/page.tsx`

첫 로그인 시 (또는 `/onboarding` URL로 접근 시) 표시:

```
┌─────────────────────────────────────┐
│           Newstock                  │
│   뉴스로 배우는 모의 주식 투자       │
│                                     │
│  1단계  📰 뉴스 읽기                │
│         과거 종목 뉴스를 읽어요      │
│                                     │
│  2단계  🎯 퀴즈 풀기                │
│         뉴스 후 주가 등락 예측       │
│                                     │
│  3단계  📈 투자하기                 │
│         코인으로 모의 주식 거래      │
│                                     │
│         [시작하기 →]                 │
└─────────────────────────────────────┘
```

시작하기 버튼 클릭 시 `/dashboard`로 이동.

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

### 2. 개발 서버 실행 + 실시간 확인

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** — 내가 만든 컴포넌트 실시간 확인 가능.  
파일 저장할 때마다 자동 새로고침.

---

### 3. 첫 번째 브랜치 작업

```bash
git checkout main
git pull origin main

npm run dev
# 작업 중에 http://localhost:3000 보면서 확인
```

`src/components/ui/` 폴더에 컴포넌트 파일 만들고, `src/app/globals.css`에 CSS 변수 추가.

완료 후:

```bash
git add .
git commit -m "feat: 공통 UI 컴포넌트 추가"
git push origin main
```

push한 뒤 Vercel 배포와 실제 화면을 확인합니다.

---

### 4. 두 번째 / 세 번째 브랜치

```bash
# 두 번째
git checkout main
git pull origin main
# 작업 후
npm run build
git add .
git commit -m "feat: 카드 언락 애니메이션 추가"
git push origin main

# 세 번째
git checkout main
git pull origin main
# 작업 후
npm run build
git add .
git commit -m "feat: 온보딩 화면 구현"
git push origin main
```

---

## 이 프로젝트 폴더 구조 (UI/UX 담당 관련)

```
Newstock/
├── src/
│   ├── app/
│   │   ├── globals.css             ← CSS 변수 추가 위치
│   │   └── (main)/
│   │       └── onboarding/
│   │           └── page.tsx        ← 내가 만들 파일 (온보딩 화면)
│   └── components/
│       ├── ui/                     ← 내가 만들 폴더 + 파일들
│       │   ├── Button.tsx
│       │   ├── Badge.tsx
│       │   ├── Card.tsx
│       │   └── Toast.tsx
│       └── quiz/
│           └── StockQuizCard.tsx   ← 언락 애니메이션 수정 대상 (이미 있음)
└── reference/
    └── design_reference.html       ← 디자인 참고용 (브라우저로 열기)
```

> `src/components/ui/`는 없는 폴더라 VS Code에서 직접 만들어야 함.  
> 좌측 파일 탐색기에서 `components` 폴더 우클릭 → New Folder → `ui`

---

## 완료 확인 체크리스트

- [ ] `globals.css`에 CSS 변수 추가 완료
- [ ] `src/components/ui/` 폴더 생성
- [ ] Button, Badge, Card, Toast 컴포넌트 4개 구현
- [ ] 디자인 시스템 작업 main push 완료
- [ ] 종목 카드 언락 애니메이션 추가
- [ ] 모바일 레이아웃 점검
- [ ] 종목 카드 UI 작업 main push 완료
- [ ] 온보딩 화면 구현 (`/onboarding` 접근 시 표시)
- [ ] 온보딩 UI 작업 main push 완료
- [ ] 최원준에게 완료 알림
