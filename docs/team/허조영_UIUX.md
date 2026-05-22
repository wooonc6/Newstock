# 허조영 — UI/UX 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/design-system` | 공통 UI 컴포넌트 제작 | 1번 |
| `feat/stock-card-ui` | 종목 카드 UI 개선 | 2번 |
| `feat/onboarding-ui` | 온보딩 화면 | 3번 |

> 디자인 레퍼런스: `reference/design_reference.html` 브라우저로 열면 전체 디자인 확인 가능
> 담당 화면 CSS/구조 보고 `.tsx` 컴포넌트로 변환하면 됩니다

---

## 1. 공통 컴포넌트 (`feat/design-system`)

`src/components/ui/` 폴더에 생성:

| 파일 | 내용 |
|------|------|
| `Button.tsx` | primary / outline / danger 변형 |
| `Badge.tsx` | 섹터 배지, 랭킹 메달 |
| `Card.tsx` | 공통 카드 래퍼 |
| `Toast.tsx` | 토스트 알림 |

HTML의 CSS 변수 → `src/app/globals.css`에 반영:
```css
--accent: #00e5b0;
--bg: #080d17;
--surface: #0f1724;
--surface2: #162033;
--warn: #f59e0b;
--danger: #ef4444;
```

### 컴포넌트 예시 구조

```tsx
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'danger'
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  // design_reference.html의 .btn 클래스 참고
}
```

---

## 2. 카드 UI 개선 (`feat/stock-card-ui`)

파일: `src/components/quiz/StockQuizCard.tsx`

- 퀴즈 통과 시 잠금 해제 애니메이션
- 모바일 반응형 레이아웃 점검

> `design_reference.html`의 종목 카드 영역 CSS/애니메이션 참고

---

## 3. 온보딩 화면 (`feat/onboarding-ui`)

만들어야 할 파일: `src/app/(main)/onboarding/page.tsx`

첫 로그인 시 표시:
1. 서비스 소개
2. 3단계 안내: 뉴스 읽기 → 퀴즈 풀기 → 투자하기
3. 시작하기 버튼

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

> 💡 팁: VS Code에서 작업하면 파일 편집 + 터미널 + 미리보기를 한 화면에서 할 수 있어 편함

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
copy .env.example .env.local
```

이은우한테 받은 Supabase URL/KEY를 `.env.local`에 입력.

---

### 2. 디자인 레퍼런스 여는 방법

`reference/design_reference.html` 파일을 **파일 탐색기에서 더블클릭** → 크롬/엣지 브라우저에서 열림.
각 탭(대시보드/퀴즈/랭킹 등) 클릭하며 디자인 확인.

---

### 3. 개발 서버 실행 + 실시간 확인 방법

```bash
# 터미널에서 (Newstock 폴더 안에 있어야 함)
npm run dev
```

브라우저에서 **http://localhost:3000** 열기 → 내가 만든 컴포넌트 실시간 확인 가능.
파일 저장할 때마다 자동으로 새로고침됨.

---

### 4. 첫 번째 브랜치 작업 (`feat/design-system`)

```bash
# 최신 코드 받기
git checkout main
git pull origin main

# 내 브랜치 만들기
git checkout -b feat/design-system

# 서버 실행
npm run dev
```

`src/components/ui/` 폴더에 컴포넌트 파일 만들고 작업.
`src/app/globals.css`에 CSS 변수 추가.

완료 후:

```bash
git add .
git commit -m "feat: 공통 UI 컴포넌트 추가"
git push origin feat/design-system
```

---

### 5. 두 번째 / 세 번째 브랜치

```bash
# 두 번째
git checkout main
git pull origin main
git checkout -b feat/stock-card-ui
# 작업 후
git add .
git commit -m "feat: 카드 언락 애니메이션 추가"
git push origin feat/stock-card-ui

# 세 번째
git checkout main
git pull origin main
git checkout -b feat/onboarding-ui
# 작업 후
git add .
git commit -m "feat: 온보딩 화면 구현"
git push origin feat/onboarding-ui
```

---

### 6. PR(Pull Request) 올리기

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

## GitHub 브랜치 읽는 법

**https://github.com/wooonc6/Newstock/tree/feat/design-system** 접속하면 아래처럼 보임.

```
feat/design-system ▼   17 Branches

This branch is 28 commits behind main.          ← ① 정상. 의도적인 것
                                      [Contribute ▼]

wooonc6  feat: 공통 UI 컴포넌트 추가   🕐 3 Commits   ← ②

📁 src/                feat: 공통 UI 컴포넌트 추가      last week   ← ③
📄 .gitignore          Initial commit: Newstock...    2 weeks ago
```

**① "X commits behind main"**
→ main에 더 많은 커밋이 있다는 뜻. **문제 아님.** 내 브랜치엔 UI 관련 커밋만 있으면 됨.

**② 커밋 수 + 마지막 커밋 메시지**
→ 이 브랜치에 총 몇 개 커밋이 있는지, 가장 최근 커밋이 뭔지.

**③ 파일/폴더 목록 + 마지막으로 수정한 커밋**
→ 각 파일이 어느 커밋에서 바뀌었는지. 내가 커밋하면 여기에 표시됨.
→ `src` → `components` → `ui` 폴더로 들어가면 내가 만든 컴포넌트 파일 확인 가능.

---

### 이 프로젝트 폴더 구조 (UI/UX 담당 관련)

```
Newstock/
├── src/
│   ├── app/
│   │   ├── globals.css             ← CSS 변수 추가 위치 (--accent, --bg 등)
│   │   └── (main)/
│   │       └── onboarding/
│   │           └── page.tsx        ← 내가 만들 파일 (온보딩 화면)
│   └── components/
│       ├── ui/                     ← 내가 만들 폴더 + 파일들
│       │   ├── Button.tsx              공통 버튼
│       │   ├── Badge.tsx               배지/메달
│       │   ├── Card.tsx                카드 래퍼
│       │   └── Toast.tsx               토스트 알림
│       └── quiz/
│           └── StockQuizCard.tsx   ← 언락 애니메이션 수정 대상
└── reference/
    └── design_reference.html       ← 디자인 참고용 (브라우저로 열기)
```

> `src/components/ui/`는 없는 폴더라 직접 만들어야 함. VS Code에서 우클릭 → New Folder.

---

### 완료 확인 체크리스트

- [ ] `globals.css`에 CSS 변수 추가 완료
- [ ] `src/components/ui/` 컴포넌트 4개 구현
- [ ] `feat/design-system` push + PR 완료
- [ ] 종목 카드 애니메이션 구현
- [ ] `feat/stock-card-ui` push + PR 완료
- [ ] 온보딩 화면 구현
- [ ] `feat/onboarding-ui` push + PR 완료
