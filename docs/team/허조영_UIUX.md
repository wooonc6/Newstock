# 허조영 — UI/UX 담당

**브랜치: `feat/design-system` → `feat/stock-card-ui` → `feat/onboarding-ui`**

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
