# Newstock 팀별 기술 스택 및 언어 정리

> 각 팀원의 담당 브랜치별로 사용하는 언어와 역할을 정리한 문서

---

## 최원준 — PM / FE

**담당 브랜치**: `feat/auth-flow` · `feat/quiz-unlock` · `feat/page-routing`

| 언어 / 기술 | 용도 |
|---|---|
| JavaScript / JSX | React로 화면 컴포넌트 만들 때 쓰는 언어. 버튼, 입력창, 퀴즈 화면 등을 코드로 표현 |
| TypeScript | JavaScript에 타입 검사를 추가한 버전. 팀 프로젝트에서 오류를 줄여줌. Next.js 프로젝트 기본 |
| CSS / Tailwind | 화면 스타일(색상, 간격, 글꼴 크기 등)을 지정. Tailwind는 CSS를 편하게 쓰게 해주는 도구 |

---

## 김성준 — Backend

**담당 브랜치**: `feat/news-collector` · `feat/trade-logic` · `feat/unlock-backend`

| 언어 / 기술 | 용도 |
|---|---|
| Node.js (**미확정**) | JavaScript로 서버를 만드는 환경. FE와 같은 언어라 팀 내 소통이 편하고 네트워크 작업에 강함 |
| Python (**미확정**) | 데이터 처리나 크롤링에 강한 언어. 뉴스 파싱, AI 연동 쪽에서 유리하고 라이브러리가 풍부함 |
| SQL | Supabase(DB)에 데이터를 저장하고 꺼낼 때 쓰는 언어 |

> **참고**: Node.js로 가면 팀 전체가 JavaScript로 통일되어 협업이 가장 편함

---

## 이은우 — DB

**담당 브랜치**: `feat/db-schema` · `feat/db-sync`

| 언어 / 기술 | 용도 |
|---|---|
| SQL | 테이블 구조를 만들고(schema), 데이터를 넣고 수정하는 언어. Supabase 기반이라 PostgreSQL SQL 사용 |
| PostgreSQL 문법 | 일반 SQL에서 확장된 Postgres 전용 기능. UUID 자동 생성, 날짜 함수, RLS(접근 권한 규칙) 등 |

---

## 김승민A — API / FE

**담당 브랜치**: `feat/news-feed-ui` · `feat/stock-price-ui` · `feat/ranking-ui`

| 언어 / 기술 | 용도 |
|---|---|
| JavaScript / JSX | 뉴스 피드, 주가 정보, 랭킹 화면을 React 컴포넌트로 만들 때 사용 |
| TypeScript | API에서 받아온 데이터(뉴스 목록, 주가 수치)의 형태를 타입으로 정의해서 실수를 줄임 |
| REST API 호출 | 네이버 뉴스 API나 백엔드 서버에서 데이터를 요청해서 가져오는 방식. JavaScript의 `fetch` 함수로 처리 |

---

## 허조영 — UI/UX

**담당 브랜치**: `feat/design-system` · `feat/stock-card-ui` · `feat/onboarding-ui`

| 언어 / 기술 | 용도 |
|---|---|
| JavaScript / JSX | 공통 버튼, 카드, 입력창 같은 디자인 컴포넌트를 코드로 제작. 모든 팀원이 가져다 쓸 수 있게 설계 |
| CSS / Tailwind | 색상, 폰트, 간격, 애니메이션 등 디자인 시스템의 핵심. 온보딩 화면 등 시각적 부분 담당 |
| Figma | 코드 작성 전 화면 설계를 그리는 디자인 툴. 개발 전에 시각화해서 팀과 공유 |

---

## 요약

| 팀원 | 핵심 언어 |
|---|---|
| 최원준 | JavaScript, TypeScript, CSS |
| 김성준 | Node.js 또는 Python (미확정), SQL |
| 이은우 | SQL, PostgreSQL |
| 김승민A | JavaScript, TypeScript |
| 허조영 | JavaScript, CSS, Figma |

> 대부분의 팀원이 **JavaScript / TypeScript** 기반으로 통일되어 있음.
> 백엔드 언어(Node.js vs Python)만 확정되면 전체 스택이 정리됨.
