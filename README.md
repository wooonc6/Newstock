# Newstock 팀 작업실

뉴스를 읽고 퀴즈를 풀며 주식과 모의 투자를 배우는 학습 서비스입니다.

**고투홈 팀 x 하나금융TI**

## 팀원별 정리
최원준: PM / 전체 FE 연결 / 흐름 관리
김성준: Backend / API / 뉴스 처리 / 거래 로직
이은우: DB / Supabase / SQL / RLS
김승민A: API 연동 FE / 퀴즈·랭킹 화면 기능 구현
허조영: UI/UX / 디자인 시스템 / 컴포넌트 디자인 / 화면 스타일

## 바로가기

| 구분 | 링크 |
|------|------|
| 배포 앱 | [newstock-xi.vercel.app](https://newstock-xi.vercel.app) |
| 데모 페이지 | [GitHub Pages 데모](https://wooonc6.github.io/Newstock/demo.html) |
| 전체 문서 목차 | [docs/index.md](docs/index.md) |
| 팀 작업 가이드 | [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md) |
| 배포 셋업 | [docs/SETUP_TASKS.md](docs/SETUP_TASKS.md) |
| 기획안 | [docs/기획안.md](docs/%EA%B8%B0%ED%9A%8D%EC%95%88.md) |

## 한눈에 보기

```text
과거 경제 뉴스 읽기
→ 이후 주가 상승/하락 예측
→ 정답 확인 및 코인 적립
→ 종목 언락
→ 실시간 주가 기반 모의 투자
```

## 처음 온 팀원은 여기부터

1. 아래 표에서 내 담당 문서를 엽니다.
2. `.env.example`을 참고해 `.env.local`을 만든 뒤 로컬에서 실행합니다.
3. `main`에서 작업하고 `npm run build`로 확인합니다.
4. `git push origin main` 후 배포 앱에서 실제 화면을 확인합니다.

## 역할별 문서

| 이름 | 역할 | 담당 문서 |
|------|------|-----------|
| 최원준 | PM / FE | [docs/team/최원준_PM.md](docs/team/%EC%B5%9C%EC%9B%90%EC%A4%80_PM.md) |
| 김성준 | Backend | [docs/team/김성준_Backend.md](docs/team/%EA%B9%80%EC%84%B1%EC%A4%80_Backend.md) |
| 이은우 | DB | [docs/team/이은우_DB.md](docs/team/%EC%9D%B4%EC%9D%80%EC%9A%B0_DB.md) |
| 김승민A | API / FE | [docs/team/김승민A_FE.md](docs/team/%EA%B9%80%EC%8A%B9%EB%AF%BCA_FE.md) |
| 허조영 | UI/UX | [docs/team/허조영_UIUX.md](docs/team/%ED%97%88%EC%A1%B0%EC%98%81_UIUX.md) |

## 로컬 실행

```bash
npm install
copy .env.example .env.local
npm run dev
```

`.env.local`에는 Supabase와 Naver API 값을 채워 넣습니다. 실제 값은 GitHub에 올리지 않습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | Next.js API Routes |
| DB / Auth | Supabase |
| 주가 데이터 | Yahoo Finance API (`yahoo-finance2`) |
| Hosting | Vercel |

## Git 작업 흐름

```text
main 최신화
→ 작업 및 로컬 확인
→ npm run build
→ git push origin main
→ Production 자동 배포
```

한 줄로 자동 처리하려면:

```bash
npm run push -- "feat: 작업 내용 설명"
```

이 명령은 `git pull --rebase --autostash`, `npm run build`, `git add -A`, `git commit`, `git push origin main`을 순서대로 실행합니다.

자세한 규칙은 [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md)를 참고합니다.
