# Newstock 배포 셋업 작업 분담

## 이은우 (DB 담당)

### 1. Supabase 프로젝트 생성
- [supabase.com](https://supabase.com) 접속 → GitHub 로그인
- **New Project** 클릭
  - Project name: `newstock`
  - Region: **Northeast Asia (Seoul)**
  - DB Password: 안전한 비밀번호 설정 (기록 필요)

### 2. 테이블 생성 (SQL Editor에서 실행)

```sql
-- 퀴즈 세션 테이블
create table quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  stock_ticker text not null,
  score integer,
  total integer,
  coins_earned integer,
  created_at timestamptz default now()
);

-- Row Level Security 활성화
alter table quiz_sessions enable row level security;

-- 본인 데이터만 읽기 허용
create policy "users can read own sessions"
  on quiz_sessions for select
  using (auth.uid() = user_id);

-- 본인 데이터만 쓰기 허용
create policy "users can insert own sessions"
  on quiz_sessions for insert
  with check (auth.uid() = user_id);
```

### 3. Auth 설정
- 대시보드 → **Authentication → Providers**
- **Email** provider 활성화 확인 (기본값으로 켜져 있음)
- 개발 중에는 "Confirm email" 비활성화 권장 (테스트 편의)

### 4. 최원준에게 공유할 값
- 대시보드 → **Project Settings → API** 에서 복사

| 환경변수 키 | 복사 위치 |
|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public |

> **절대 service_role 키는 공유하지 말 것**

---

## 최원준 (PM 담당)

### 1. 이은우에게 위 두 환경변수 값 받기

### 2. Vercel 환경변수 입력
- Vercel 배포 화면 → **Environment Variables** 섹션
- 아래 두 항목 추가:
  - Key: `NEXT_PUBLIC_SUPABASE_URL` / Value: 이은우에게 받은 URL
  - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` / Value: 이은우에게 받은 키

### 3. Deploy 클릭
- 배포 완료 후 URL: `https://newstock.vercel.app` (또는 유사한 이름)
- 이후 `main` 브랜치에 push하면 **자동 재배포**됨

### 4. 배포 확인
- 배포된 URL 접속 → 회원가입 → 로그인 정상 작동 확인
- 대시보드에 삼성전자·LG화학·두산에너빌리티 카드 및 실시간 주가 표시 확인

---

## 참고: Git 워크플로우

```
feat/기능명 → PR → dev → PR → main(자동배포)
```

- `main` 브랜치: Vercel 프로덕션 자동 배포
- 다른 브랜치 push or PR: Vercel Preview URL 자동 생성
