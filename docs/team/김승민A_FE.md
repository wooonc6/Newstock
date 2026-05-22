# 김승민A — API/FE 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/stock-price-ui` | yahoo-finance2 빌드 에러 수정 | 1번 ⚡ |
| `feat/news-feed-ui` | 퀴즈 화면 뉴스 피드 UI | 2번 |
| `feat/ranking-ui` | 랭킹 페이지 구현 | 3번 |

---

## 1. 빌드 에러 수정 (`feat/stock-price-ui`) — ⚡ 우선순위 1

`next.config.mjs` webpack 설정 수정  
현재 `yahoo-finance2` Deno 의존성 에러 발생 중

수정 후 확인:
```bash
npm run dev  # 에러 없이 실행되면 완료
```

---

## 2. 퀴즈 화면 UI (`feat/news-feed-ui`)

파일: `src/app/(main)/quiz/[stock]/page.tsx`

구현 내용:
- 뉴스 기사 제목 / 날짜 표시
- "주가 상승" / "주가 하락" 선택 버튼 2개
- 정답 후 실제 주가 변동 결과 표시

> 디자인: `reference/design_reference.html` 퀴즈 탭 참고

---

## 3. 랭킹 페이지 (`feat/ranking-ui`)

파일: `src/app/(main)/ranking/page.tsx`

구현 내용:
- 포트폴리오 수익률 기준 전체 순위
- 1~3위 🥇🥈🥉 메달 표시
- 내 순위 강조 표시

> 디자인: `reference/design_reference.html` 랭킹 탭 참고

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
git checkout -b feat/stock-price-ui
```

### 작업 후 올리기

```bash
git add .
git commit -m "fix: yahoo-finance2 webpack 빌드 에러 수정"
git push origin feat/stock-price-ui
```

다음 브랜치로 넘어갈 때마다:

```bash
git checkout dev && git pull origin dev
git checkout -b feat/news-feed-ui   # 또는 feat/ranking-ui
# 작업 후
git add . && git commit -m "feat: 퀴즈 뉴스 피드 UI 구현"
git push origin feat/news-feed-ui
```

### PR 올리기

1. https://github.com/wooonc6/Newstock 접속
2. **"Compare & pull request"** 클릭
3. base 브랜치 → `dev` 확인 후 PR 생성

> ⚠️ `main`에 직접 push 금지
