# Newstock 셋업 체크리스트

로컬 개발, Supabase, Vercel 배포 확인에 필요한 내용을 모은 문서입니다.

## 현재 상태

| 항목 | 상태 |
|------|------|
| Supabase 프로젝트 생성 | 완료 |
| Vercel 프로젝트 연결 | 완료 |
| Production 배포 | 완료: [newstock-xi.vercel.app](https://newstock-xi.vercel.app) |
| main 자동 배포 | 사용 중 |

## 로컬 환경변수

프로젝트 루트에서 `.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
copy .env.example .env.local
```

`.env.local`에 실제 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
CLAUDE_API_KEY=
```

실제 환경변수 값은 GitHub에 올리지 않습니다. 팀 내부 공유 채널이나 서비스 관리자에게 받아 입력합니다.

## Supabase 접근

| 항목 | 내용 |
|------|------|
| 프로젝트 | `zsdhvaylgwmmohecrsfs` |
| 대시보드 | [Supabase Dashboard](https://supabase.com/dashboard/project/zsdhvaylgwmmohecrsfs) |
| 접근 필요 인원 | DB 담당자와 관리자 |

### 초대 방법

1. Supabase Dashboard 접속
2. **Settings → Team** 이동
3. **Invite** 클릭
4. 팀원 이메일 입력
5. 역할은 작업 범위에 맞게 부여

## Vercel 배포

| 구분 | 설명 |
|------|------|
| Production | `main` push 시 자동 배포 |
| Preview | 사용하지 않음 |
| 환경변수 | Vercel **Settings → Environment Variables**에서 관리 |

배포 실패 시 먼저 확인할 것:

- Vercel Build Logs
- `.env.local`에는 있지만 Vercel에는 빠진 환경변수
- `npm run build` 로컬 실패 여부
- Supabase 테이블 / RLS 변경 여부

## 로컬 실행 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속해 확인합니다.

## 통합 테스트 체크리스트

- [ ] 회원가입 가능
- [ ] 로그인 가능
- [ ] `/dashboard` 진입 가능
- [ ] 뉴스 목록이 표시됨
- [ ] 퀴즈 문제를 풀 수 있음
- [ ] 퀴즈 제출 후 코인이 반영됨
- [ ] 3회 이상 퀴즈 완료 시 종목이 언락됨
- [ ] 언락된 종목에서 매수 / 매도 가능
- [ ] `/ranking` 화면에서 랭킹 데이터 확인 가능
