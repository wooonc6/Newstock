# Newstock 팀 작업실

> 뉴스로 배우는 모의 주식투자 서비스

**고투홈 팀 x 하나금융TI**

---

## 바로가기

| 구분 | 링크 |
|------|------|
| 배포 앱 | [newstock-xi.vercel.app](https://newstock-xi.vercel.app) |
| 데모 페이지 | [GitHub Pages 데모](https://wooonc6.github.io/Newstock/demo.html) |
| 전체 문서 목차 | [docs/index.md](docs/index.md) |
| 팀 작업 가이드 | [TEAM_GUIDE.md](TEAM_GUIDE.md) |
| 배포 셋업 | [docs/SETUP_TASKS.md](docs/SETUP_TASKS.md) |
| 기획안 | [docs/기획안.md](docs/%EA%B8%B0%ED%9A%8D%EC%95%88.md) |

---

## 처음 온 사람은 이것만 보면 됩니다

1. 아래 표에서 **내 담당 문서**를 엽니다.
2. 문서에 적힌 **담당 브랜치**를 확인합니다.
3. 작업 후 GitHub에 push하고 PR을 만듭니다.
4. Vercel Preview URL에서 화면이 정상인지 확인합니다.
5. 최종 병합 후 [배포 앱](https://newstock-xi.vercel.app)에서 다시 확인합니다.

---

## 역할별 문서

| 이름 | 역할 | 담당 문서 |
|------|------|-----------|
| 최원준 | PM / FE | [docs/team/최원준_PM.md](docs/team/%EC%B5%9C%EC%9B%90%EC%A4%80_PM.md) |
| 김성준 | Backend | [docs/team/김성준_Backend.md](docs/team/%EA%B9%80%EC%84%B1%EC%A4%80_Backend.md) |
| 이은우 | DB | [docs/team/이은우_DB.md](docs/team/%EC%9D%B4%EC%9D%80%EC%9A%B0_DB.md) |
| 김승민A | API / FE | [docs/team/김승민A_FE.md](docs/team/%EA%B9%80%EC%8A%B9%EB%AF%BCA_FE.md) |
| 허조영 | UI/UX | [docs/team/허조영_UIUX.md](docs/team/%ED%97%88%EC%A1%B0%EC%98%81_UIUX.md) |

---

## 지금 해야 할 일

| 우선순위 | 작업 | 담당 |
|----------|------|------|
| 1 | Supabase URL / anon key를 Vercel 환경변수에 등록 | 최원준 |
| 2 | 배포 URL에서 회원가입, 로그인, 대시보드 진입 확인 | 최원준 |
| 3 | Supabase 테이블과 RLS 정책 확인 | 이은우 |
| 4 | 뉴스/퀴즈/거래 API 동작 확인 | 김성준, 김승민A |
| 5 | 화면 UI와 사용성 최종 점검 | 허조영, 최원준 |

---

## GitHub 작업 흐름

```text
feat/기능명 브랜치에서 작업
→ Pull Request 생성
→ Vercel Preview URL 확인
→ dev 또는 main으로 병합
→ main 병합 시 Production 자동 배포
```

중요한 규칙:

- `main`에 직접 push하지 않습니다.
- PR을 만들 때는 변경 내용, 확인한 화면, 남은 이슈를 적습니다.
- 배포가 실패하면 Vercel의 Build Logs를 먼저 확인합니다.
- `.env.local`은 GitHub에 올리지 않습니다.

---

## 로컬 실행

```bash
npm install
npm run dev
```

로컬 환경변수는 `.env.local`에 넣습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Vercel에는 같은 값을 **Settings → Environment Variables**에서 직접 등록합니다.

---

## 서비스 소개

과거 경제 뉴스를 읽고, 그 이후 주가가 오를지 내릴지 맞히는 퀴즈 기반 주식 학습 서비스입니다. 정답을 맞히면 현금이 쌓이고, 종목을 언락하면 실시간 주가로 모의 투자까지 할 수 있습니다.

```text
시기별 뉴스 읽기 → 상승/하락 예측 → 결과 확인 → 현금 적립 → 모의 투자
```

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript |
| Backend | Next.js API Routes |
| DB / Auth | Supabase |
| 주가 데이터 | Yahoo Finance API |
| 호스팅 | Vercel |
