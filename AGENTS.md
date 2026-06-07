# Newstock — Codex 프로젝트 가이드

## 서비스 개요

뉴스를 읽고 퀴즈를 풀어 주식을 배우는 모의 투자 학습 서비스

- **레포**: https://github.com/wooonc6/Newstock
- **타겟**: 주식 입문자, 경제 뉴스에 관심 있는 10~30대

## 기술 스택

| 영역 | 기술 |
|------|------|
| FE | React / Next.js (TypeScript) |
| BE | Next.js API Routes (별도 Express 서버 없음 — Vercel 무료티어 통합 배포) |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| 주가 데이터 | Yahoo Finance API (yahoo-finance2) — 국내 종목 전용 |
| AI | Codex API (라이브 트랙 추가 시 사용 예정) |
| 호스팅 | Vercel (https://newstock-xi.vercel.app) |

## 팀 구성 및 담당 작업

| 이름 | 역할 | 담당 작업 |
|------|------|------------|
| 최원준 | PM / FE | `feat/auth-flow` `feat/quiz-unlock` `feat/page-routing` |
| 김성준 | Backend | `feat/news-collector` `feat/trade-logic` `feat/unlock-backend` |
| 이은우 | DB | `feat/db-schema` `feat/db-sync` |
| 김승민A | API / FE | `feat/news-feed-ui` `feat/stock-price-ui` `feat/ranking-ui` |
| 허조영 | UI/UX | `feat/design-system` `feat/stock-card-ui` `feat/onboarding-ui` |

## Git 워크플로우

```
main 최신화 → main에서 작업 → npm run build → git push origin main → Vercel 자동 배포
```

- `main`: push하면 Vercel 자동 배포됨
- 팀원 접근성을 위해 `dev` 브랜치와 PR 단계는 사용하지 않음

커밋 컨벤션: `feat` / `fix` / `chore` / `style` / `refactor` / `docs`

## 개발 환경 설정

```bash
git --version   # 2.x 이상
node --version  # 18.x 이상

copy .env.example .env.local
# .env.local에 각자 발급받은 키 입력
```

### 환경변수 항목

| 키 | 설명 |
|----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 공개 키 |
| `NAVER_CLIENT_ID` | 네이버 개발자 앱 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 개발자 앱 Client Secret |
| `CLAUDE_API_KEY` | Codex AI API 키 (라이브 트랙 추가 시) |

> `.env.local`은 절대 커밋하지 말 것 (`.gitignore`에 포함됨)
