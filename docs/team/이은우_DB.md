# 이은우 — DB 담당

## 담당 작업

| 담당 영역 | 작업 내용 | 주로 올릴 위치 | 순서 |
|----------|----------|----------------|------|
| DB 스키마 | Supabase 테이블 생성 SQL | `supabase/migrations` | 1번 ⚡ |
| 샘플 데이터 | 뉴스 샘플 데이터 SQL | `supabase/seed.sql` 또는 `supabase/migrations` | 2번 |
| RLS / 트리거 | RLS 정책 + 회원가입 트리거 SQL | `supabase/migrations` | 3번 |
| DB 설명 문서 | 테이블 설명, RLS 설명, 실행 방법 정리 | `docs/db` | 필요 시 |

> 브랜치는 나누지 않고 `main` 브랜치에서 직접 작업합니다.

> ⚡ 다른 기능 전부 DB에 의존 — 가장 먼저 완료 필요

---

## Supabase 접속 정보

Supabase 프로젝트는 팀 내부 공유 링크 또는 초대 링크로 접속합니다.

> 실제 키, 비밀번호, `.env.local` 내용은 GitHub에 올리지 않습니다.

---

## SQL 파일 위치 규칙

실제로 Supabase SQL Editor에서 실행할 SQL 파일은 `docs/db`가 아니라 `supabase` 폴더에 저장합니다.

```text
Newstock/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_user_identity_and_ranking.sql
│   └── seed.sql
└── docs/
    └── db/
        └── DB 설명 문서만 저장
```

| SQL 종류 | 위치 |
|----------|------|
| 테이블 생성 SQL | `supabase/migrations/001_create_tables.sql` |
| RLS 정책 SQL | `supabase/migrations/002_rls_policies.sql` |
| 회원가입 트리거 SQL | `supabase/migrations/003_auth_trigger.sql` |
| 랭킹 / 유저 식별 관련 SQL | `supabase/migrations/004_user_identity_and_ranking.sql` |
| 샘플 데이터 INSERT SQL | `supabase/seed.sql` |
| 설명용 문서 | `docs/db/*.md` |

`src`는 웹앱 코드 폴더이므로 SQL 파일을 넣지 않습니다.

---

## Supabase SQL Editor에서 실행하는 방법

1. Supabase 프로젝트 접속
2. 왼쪽 사이드바 **SQL Editor** 클릭
3. **New query** 클릭
4. `supabase/migrations` 또는 `supabase/seed.sql`에 있는 SQL 내용 복사
5. 붙여넣기
6. **RUN** 클릭 또는 `Ctrl + Enter`
7. Table Editor에서 테이블과 데이터 확인

실행 전 아래 명령이 있으면 바로 실행하지 말고 팀에 확인합니다.

```sql
DROP TABLE
DELETE FROM
TRUNCATE
ALTER TABLE ... DROP COLUMN
```

---

## 기본 테이블 생성 예시

```sql
create table if not exists curated_news (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  company      text not null,
  ticker       text not null,
  news_date    date not null,
  category     text,
  difficulty   text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at   timestamptz default now()
);

create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text,
  email        text,
  coins        int default 1000000,
  streak       int default 0,
  sessions     int default 0,
  last_date    text,
  created_at   timestamptz default now()
);
```

실제 최종 SQL은 `supabase/migrations`에 있는 파일을 기준으로 관리합니다.

---

## 샘플 데이터 위치

뉴스 샘플 데이터는 다음 위치 중 하나로 저장합니다.

```text
supabase/seed.sql
```

또는 migration으로 관리할 경우:

```text
supabase/migrations/003_seed_data.sql
```

추천은 `supabase/seed.sql`입니다.

---

## GitHub에 올리는 방법

### 1. 처음 한 번만 — 레포 클론

```bash
cd Desktop
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고, 팀 내부 공유 채널에서 받은 실제 값을 입력합니다.

```bash
copy .env.example .env.local
```

> `.env.local`은 GitHub에 올리지 않습니다.

### 3. main에서 작업하고 push

브랜치를 따로 만들지 않고 `main`에서 작업합니다.

```bash
git checkout main
git pull origin main

# SQL 파일은 supabase/migrations 또는 supabase/seed.sql에 저장
git add .
git commit -m "feat: Supabase SQL 추가"
git push origin main
```

SQL 파일을 push한 뒤에는 Supabase SQL Editor에서 직접 실행하고, 실행 결과를 팀에 공유합니다.

---

## 완료 확인 체크리스트

- [ ] 테이블 생성 SQL을 `supabase/migrations`에 저장
- [ ] 샘플 데이터 SQL을 `supabase/seed.sql` 또는 `supabase/migrations`에 저장
- [ ] RLS / 트리거 SQL을 `supabase/migrations`에 저장
- [ ] Supabase SQL Editor에서 SQL 실행
- [ ] Table Editor에서 테이블 생성 확인
- [ ] `curated_news` 데이터 입력 확인
- [ ] 회원가입 후 `users` 테이블에 자동으로 행 추가되는지 확인
- [ ] 실행한 SQL과 변경 사항을 팀에 공유
