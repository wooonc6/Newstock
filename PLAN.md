# 뉴스스톡 고투홈 — 기획 확정 문서

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 뉴스스톡 고투홈 (Newstock) |
| 한 줄 소개 | 뉴스를 읽고 퀴즈를 풀어 주식을 배우는 모의 투자 학습 서비스 |
| 타겟 사용자 | 주식 입문자, 경제 뉴스에 관심 있는 10~30대 |
| 핵심 가치 | 뉴스 → 퀴즈 → 모의투자로 이어지는 학습 흐름 |

---

## 핵심 기능 목록

| 기능 | 설명 | 관련 브랜치 |
|------|------|------------|
| 온보딩 | 서비스 첫 진입 안내 및 회원가입 유도 | `feat/onboarding-ui` |
| 인증 | 로그인 / 회원가입 (Supabase Auth) | `feat/auth-flow` |
| 뉴스 피드 | 네이버 API로 수집한 경제 뉴스 목록 표시 | `feat/news-feed-ui` `feat/news-collector` |
| 퀴즈 | 뉴스 기반 주식 퀴즈 제공 (Claude AI 활용) | `feat/quiz-unlock` `feat/unlock-backend` |
| 퀴즈 잠금 해제 | 조건 충족 시 다음 퀴즈 해금 | `feat/quiz-unlock` `feat/unlock-backend` |
| 모의 투자 | 가상 자산으로 주식 매수/매도 체험 | `feat/trade-logic` |
| 주가 정보 | 종목별 현재가 및 차트 표시 | `feat/stock-price-ui` `feat/stock-card-ui` |
| 랭킹 | 수익률 기반 사용자 랭킹 | `feat/ranking-ui` |
| 페이지 라우팅 | SPA 페이지 간 이동 구조 | `feat/page-routing` |
| 디자인 시스템 | 공통 컴포넌트 / 색상 / 타이포 규칙 | `feat/design-system` |

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| **FE** | React / Next.js | 페이지 라우팅, 퀴즈·투자 UI |
| **BE** | TBD (Node.js or Python) | 뉴스 수집, 거래 로직 API |
| **DB** | Supabase (PostgreSQL) | 유저, 퀴즈, 거래 데이터 |
| **인증** | Supabase Auth | 소셜 로그인 포함 예정 |
| **뉴스 API** | 네이버 검색 API | 경제 뉴스 수집 |
| **AI** | Claude API (Anthropic) | 퀴즈 생성 및 해설 |
| **호스팅** | TBD | Vercel / Supabase 등 검토 중 |

---

## 역할 분담 상세

### 최원준 — PM / FE

| 구분 | 내용 |
|------|------|
| 역할 | 프로젝트 전체 관리, 프론트엔드 개발 |
| 담당 기능 | 인증 흐름, 퀴즈 잠금 해제 UI, 페이지 라우팅 구조 |
| 담당 브랜치 | `feat/auth-flow` `feat/quiz-unlock` `feat/page-routing` |
| 개발 환경 | Node.js 18+, VS Code, React/Next.js, npm |

### 김성준 — Backend

| 구분 | 내용 |
|------|------|
| 역할 | 서버 개발, 비즈니스 로직 구현 |
| 담당 기능 | 뉴스 수집 서버, 모의 거래 로직, 퀴즈 해금 API |
| 담당 브랜치 | `feat/news-collector` `feat/trade-logic` `feat/unlock-backend` |
| 개발 환경 | Node.js 18+ or Python 3.11+, Postman (API 테스트), VS Code |

### 이은우 — DB

| 구분 | 내용 |
|------|------|
| 역할 | 데이터베이스 설계 및 관리 |
| 담당 기능 | 스키마 설계, 마이그레이션, DB 동기화 |
| 담당 브랜치 | `feat/db-schema` `feat/db-sync` |
| 개발 환경 | Supabase Dashboard, DBeaver or TablePlus (DB GUI), SQL |

### 김승민A — API / FE

| 구분 | 내용 |
|------|------|
| 역할 | 외부 API 연동, 데이터 표시 UI 개발 |
| 담당 기능 | 뉴스 피드 화면, 주가 정보 화면, 랭킹 화면 |
| 담당 브랜치 | `feat/news-feed-ui` `feat/stock-price-ui` `feat/ranking-ui` |
| 개발 환경 | Node.js 18+, VS Code, Postman, React/Next.js, npm |

### 허조영 — UI/UX

| 구분 | 내용 |
|------|------|
| 역할 | 디자인 시스템 구축, UI 컴포넌트 개발 |
| 담당 기능 | 공통 디자인 시스템, 종목 카드 UI, 온보딩 화면 |
| 담당 브랜치 | `feat/design-system` `feat/stock-card-ui` `feat/onboarding-ui` |
| 개발 환경 | Figma (디자인), VS Code, React/Next.js, npm |

---

## 역할별 개발 환경 요약

| 이름 | OS | 에디터 | 주요 도구 |
|------|----|--------|-----------|
| 최원준 | 무관 | VS Code | Node.js 18+, npm, React/Next.js |
| 김성준 | 무관 | VS Code | Node.js 18+ or Python 3.11+, Postman |
| 이은우 | 무관 | VS Code | Supabase CLI, DBeaver or TablePlus |
| 김승민A | 무관 | VS Code | Node.js 18+, npm, Postman |
| 허조영 | 무관 | VS Code | Node.js 18+, npm, Figma |

### 공통 필수 설치

```bash
# Git
git --version  # 2.x 이상

# Node.js
node --version  # 18.x 이상 권장
npm --version

# 로컬 환경변수 설정
copy .env.example .env.local
# → .env.local 열고 각자 발급받은 키 입력
```

---

> 기술 스택 중 TBD 항목은 팀 논의 후 확정 예정
