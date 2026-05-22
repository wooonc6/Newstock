# 허조영 — UI/UX 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/design-system` | 공통 UI 컴포넌트 제작 | 1번 |
| `feat/stock-card-ui` | 종목 카드 UI 개선 | 2번 |
| `feat/onboarding-ui` | 온보딩 화면 | 3번 |

> 🎨 `reference/design_reference.html` 브라우저로 열면 전체 디자인 확인 가능  
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

---

## 2. 카드 UI 개선 (`feat/stock-card-ui`)

파일: `src/components/quiz/StockQuizCard.tsx`

- 퀴즈 통과 시 잠금 해제 애니메이션
- 모바일 반응형 레이아웃 점검

---

## 3. 온보딩 화면 (`feat/onboarding-ui`)

첫 로그인 시 표시:
1. 서비스 소개
2. 3단계 안내: 뉴스 읽기 → 퀴즈 풀기 → 투자하기
3. 시작하기 버튼

---

## GitHub에 올리는 방법

### 처음 한 번만 — 레포 클론

```bash
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 작업 시작

```bash
git checkout dev
git pull origin dev
git checkout -b feat/design-system
```

### 작업 후 올리기

```bash
git add .
git commit -m "feat: 공통 UI 컴포넌트 추가"
git push origin feat/design-system
```

다음 브랜치로 넘어갈 때마다:

```bash
git checkout dev && git pull origin dev
git checkout -b feat/stock-card-ui   # 또는 feat/onboarding-ui
# 작업 후
git add . && git commit -m "feat: 카드 언락 애니메이션 추가"
git push origin feat/stock-card-ui
```

### PR 올리기

1. https://github.com/wooonc6/Newstock 접속
2. **"Compare & pull request"** 클릭
3. base 브랜치 → `dev` 확인 후 PR 생성

> ⚠️ `main`에 직접 push 금지
