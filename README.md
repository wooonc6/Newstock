# 뉴스스톡 고투홈 (Newstock)

> 과거 뉴스를 읽고 주가 변동을 맞히며 주식을 배우는 모의 투자 학습 서비스

---

## 서비스 흐름

```
과거 뉴스 선택 → 본문 읽기 → 주가 변동 퀴즈 (1/3/6개월) → 결과 확인 → 코인 획득 → 모의 투자
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| FE + BE | Next.js (TypeScript) — API Routes로 백엔드 통합 |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| 주가 데이터 | Yahoo Finance API (yahoo-finance2) |
| AI | Claude API (라이브 트랙 추가 시 사용 예정) |
| 호스팅 | Vercel 무료티어 (프론트+백 통합 배포) |

> **Express 별도 서버를 쓰지 않는 이유**: Next.js API Routes를 쓰면 Vercel 무료티어 하나로
> 프론트엔드와 백엔드를 함께 배포할 수 있어 별도 서버 호스팅 비용이 발생하지 않습니다.

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

## 로컬 환경 설정

```bash
# 1. 의존성 설치 (루트에서)
npm install

# 2. 환경변수 설정
copy .env.example .env.local
# .env.local에 각자 발급받은 키 입력

# 3. 개발 서버 실행
npm run dev   # http://localhost:3000
# API: http://localhost:3000/api/learning/news
```

### 환경변수 항목

| 키 | 설명 |
|----|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (Project Settings > API) |
| `SUPABASE_ANON_KEY` | Supabase 익명 공개 키 (Project Settings > API) |
| `NAVER_CLIENT_ID` | 네이버 개발자 앱 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 개발자 앱 Client Secret |
| `PORT` | 서버 포트 (기본값 4000) |
| `CLAUDE_API_KEY` | Claude AI API 키 (라이브 트랙 추가 시 사용) |

> `.env.local` 등 실제 키가 담긴 파일은 **절대 커밋하지 마세요**
