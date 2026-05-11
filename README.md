# 뉴스스톡 고투홈 (Newstock)

> 뉴스 기반 주식 학습 퀴즈 & 모의 투자 서비스

---

## 팀원 및 역할

| 이름 | 역할 | 담당 브랜치 |
|------|------|------------|
| 최원준 | PM / FE | `feat/auth-flow` `feat/quiz-unlock` `feat/page-routing` |
| 김성준 | Backend | `feat/news-collector` `feat/trade-logic` `feat/unlock-backend` |
| 이은우 | DB | `feat/db-schema` `feat/db-sync` |
| 김승민A | API / FE | `feat/news-feed-ui` `feat/stock-price-ui` `feat/ranking-ui` |
| 허조영 | UI/UX | `feat/design-system` `feat/stock-card-ui` `feat/onboarding-ui` |

---

## 브랜치 전략

```
main
└── dev
    ├── feat/auth-flow
    ├── feat/quiz-unlock
    ├── feat/page-routing
    ├── feat/news-collector
    ├── feat/trade-logic
    ├── feat/unlock-backend
    ├── feat/db-schema
    ├── feat/db-sync
    ├── feat/news-feed-ui
    ├── feat/stock-price-ui
    ├── feat/ranking-ui
    ├── feat/design-system
    ├── feat/stock-card-ui
    └── feat/onboarding-ui
```

| 브랜치 | 용도 |
|--------|------|
| `main` | 배포용 최종 브랜치. 직접 push 금지, PR로만 병합 |
| `dev` | 통합 개발 브랜치. feat 브랜치들을 여기서 합침 |
| `feat/*` | 기능 단위 개발 브랜치. 완료 후 `dev`로 PR |

### 작업 흐름

```
feat/기능명 → (PR) → dev → (PR) → main
```

1. `dev`에서 `feat/기능명` 브랜치 생성
2. 기능 개발 후 `dev`로 PR 요청
3. 팀원 리뷰 & 머지
4. 배포 준비 완료 시 `dev` → `main` PR

### 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
chore: 설정, 패키지 등 기타 변경
style: UI/스타일 변경
refactor: 리팩토링
docs: 문서 수정
```

---

## 브랜치별 기능 설명

| 브랜치 | 기능 |
|--------|------|
| `feat/auth-flow` | 로그인 / 회원가입 인증 흐름 |
| `feat/quiz-unlock` | 퀴즈 잠금 해제 로직 (FE) |
| `feat/page-routing` | 페이지 라우팅 구조 |
| `feat/news-collector` | 뉴스 수집 및 파싱 서버 |
| `feat/trade-logic` | 모의 거래 로직 서버 |
| `feat/unlock-backend` | 퀴즈 잠금 해제 백엔드 API |
| `feat/db-schema` | DB 스키마 설계 및 마이그레이션 |
| `feat/db-sync` | DB 동기화 및 연동 |
| `feat/news-feed-ui` | 뉴스 피드 화면 |
| `feat/stock-price-ui` | 주가 정보 화면 |
| `feat/ranking-ui` | 랭킹 화면 |
| `feat/design-system` | 공통 디자인 시스템 / 컴포넌트 |
| `feat/stock-card-ui` | 종목 카드 UI |
| `feat/onboarding-ui` | 온보딩 화면 |

---

## 환경 변수

### 초기 설정

`.env.example`을 복사해 `.env.local`을 만든 뒤 실제 키 값을 입력하세요.

```bash
# Mac / Linux
cp .env.example .env.local

# Windows
copy .env.example .env.local
```

### 항목 설명

| 키 | 설명 |
|----|------|
| `CLAUDE_API_KEY` | Claude AI API 키 ([console.anthropic.com](https://console.anthropic.com)) |
| `SUPABASE_URL` | Supabase 프로젝트 URL (Project Settings > API) |
| `SUPABASE_ANON_KEY` | Supabase 익명 공개 키 (Project Settings > API) |
| `NAVER_CLIENT_ID` | 네이버 개발자 앱 Client ID ([developers.naver.com](https://developers.naver.com)) |
| `NAVER_CLIENT_SECRET` | 네이버 개발자 앱 Client Secret |

### 주의사항

- `.env.local` 등 실제 키가 담긴 파일은 **절대 커밋하지 마세요**
- `.env.example`에는 키 이름만 남기고 값은 비워두세요
- 키를 새로 추가했다면 `.env.example`에도 항목을 추가해 주세요
