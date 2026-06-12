# Newstock 팀 가이드

이 문서는 팀원이 GitHub `main` 브랜치를 열었을 때 바로 작업 맥락을 이해할 수 있도록 정리한 운영 가이드입니다.

## 서비스 플로우

```text
과거 뉴스 선택
→ "이 뉴스 이후 주가가 올랐을까요?" 퀴즈 풀이
→ 정답이면 코인 지급 및 종목 투자 권한 해제
→ 실시간 야후 주가로 모의 투자
→ 수익률 기반 랭킹 경쟁
```

## 현재 구현 현황

| 기능 | 상태 |
|------|------|
| 로그인 / 회원가입 / 비밀번호 찾기 | 완료 |
| 인증 미들웨어 / 전역 인증 상태 | 완료 |
| 페이지 라우팅 | 완료 |
| 실시간 야후 주가 API (`/api/stocks/[ticker]`) | 완료 |
| 뉴스 목록 API (`/api/learning/news`) | 완료 |
| 뉴스 상세 API (`/api/learning/news/[id]`) | 완료 |
| 퀴즈 문제 생성 API (`/api/learning/quiz/[newsId]`) | 완료 |
| 퀴즈 제출 API (`/api/quiz/submit`) | 완료 |
| 거래 API (`/api/trade`) | 완료 |
| 대시보드 + 퀴즈 언락 UI | 완료 |
| 헤더 / 네비게이션 | 완료 |
| Vercel 배포 | 완료 |

## 지금 우선순위

| 우선순위 | 작업 | 담당 |
|----------|------|------|
| 1 | Supabase 테이블, RLS, 샘플 뉴스 데이터 확인 | 이은우 |
| 2 | `curated_news` 데이터 보강 및 `source_url` 추가 | 김성준 |
| 3 | 퀴즈 화면 UI와 API 연결 점검 | 김승민A, 최원준 |
| 4 | 포트폴리오 / 랭킹 / 히스토리 화면 완성도 점검 | 김승민A, 허조영 |
| 5 | 배포 앱에서 회원가입, 로그인, 퀴즈, 거래까지 통합 테스트 | 전원 |

## 팀원별 담당 위치

| 팀원 | 담당 | 주로 올릴 위치 | 문서 |
|------|------|----------------|------|
| 최원준 | PM / FE | `src/app`, `src/components`, `docs` | [team/최원준_PM.md](team/%EC%B5%9C%EC%9B%90%EC%A4%80_PM.md) |
| 김성준 | Backend | `src/app/api`, `src/lib` | [team/김성준_Backend.md](team/%EA%B9%80%EC%84%B1%EC%A4%80_Backend.md) |
| 이은우 | DB | `supabase/migrations`, `supabase/seed.sql`, `docs/db` | [team/이은우_DB.md](team/%EC%9D%B4%EC%9D%80%EC%9A%B0_DB.md) |
| 김승민A | API / FE | `src/app`, `src/components`, `src/lib` | [team/김승민A_FE.md](team/%EA%B9%80%EC%8A%B9%EB%AF%BCA_FE.md) |
| 허조영 | UI/UX | `src/components`, `src/app`, `public`, `reference` | [team/허조영_UIUX.md](team/%ED%97%88%EC%A1%B0%EC%98%81_UIUX.md) |

## 파일 위치 규칙

| 파일 종류 | 올릴 위치 |
|----------|----------|
| 화면 / 페이지 코드 | `src/app` |
| UI 컴포넌트 | `src/components` |
| API Route | `src/app/api` |
| 공통 함수, Supabase 연결 코드 | `src/lib` |
| TypeScript 타입 | `src/types` |
| 실제 실행할 DB SQL | `supabase/migrations` |
| 샘플 데이터 SQL | `supabase/seed.sql` |
| DB 설명 문서 | `docs/db` |
| 팀 문서 / 회의록 / 설명서 | `docs` |
| 이미지 / 정적 파일 | `public` |
| 디자인 참고자료 | `reference` |
| 실제 환경변수 파일 `.env.local` | GitHub에 올리지 않음 |

## 로컬 개발 순서

```bash
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
copy .env.example .env.local
npm run dev
```

`.env.local`에 필요한 값은 팀 내부 공유 채널에서 받아 입력합니다. `.env.local`은 커밋하지 않습니다.

## GitHub 작업 규칙

이 프로젝트는 담당 브랜치를 나누지 않고 `main` 브랜치에 직접 올립니다. 작업 전에는 항상 `main`을 최신화합니다.

```bash
git checkout main
git pull origin main
```

작업 후에는 빌드를 확인하고 `main`에 push합니다.

```bash
npm run build
git add .
git commit -m "feat: 작업 내용 한 줄 설명"
git push origin main
```

위 과정을 한 번에 실행하려면:

```bash
npm run push -- "feat: 작업 내용 한 줄 설명"
```

이 명령은 `main` 브랜치에서만 실행되며, 빌드가 실패하면 커밋과 push를 멈춥니다.

push 후 확인할 것:

- Vercel 배포가 성공했는지 확인
- [배포 앱](https://newstock-xi.vercel.app)에서 내가 바꾼 화면 또는 API 확인
- Supabase 테이블이나 환경변수 변경이 있었다면 팀에 공유

## 배포 규칙

- `main`에 push하면 Vercel Production 배포가 자동으로 실행됩니다.
- 배포 실패 시 Vercel Build Logs를 먼저 확인합니다.
- 팀 접근성을 우선해 `dev` 브랜치와 PR 단계는 사용하지 않습니다.

## 환경변수 규칙

필요한 키는 [.env.example](../.env.example)에 정리되어 있습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
CLAUDE_API_KEY=
```

실제 값은 `.env.local` 또는 Vercel Environment Variables에만 넣습니다.

## 참고 링크

- 배포 앱: [newstock-xi.vercel.app](https://newstock-xi.vercel.app)
- 레포: [github.com/wooonc6/Newstock](https://github.com/wooonc6/Newstock)
- 디자인 레퍼런스: [reference/design_reference.html](../reference/design_reference.html)
- 전체 문서 목차: [index.md](index.md)
