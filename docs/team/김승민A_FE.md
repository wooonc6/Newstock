# 김승민A — API/FE 담당

**브랜치: `feat/stock-price-ui` → `feat/news-feed-ui` → `feat/ranking-ui`**

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
