# 김성준 — Backend 담당

## 담당 작업

| 담당 영역 | 작업 내용 | 주로 수정할 위치 | 순서 |
|----------|----------|----------------|------|
| 뉴스 데이터 / 관리자 API | `curated_news` 데이터 보강 + `source_url` 자동 생성 | `src/app/api`, `src/lib`, `supabase/seed.sql` | 1번 |
| 퀴즈 채점 API | 퀴즈 채점 + 코인 지급 API 점검 | `src/app/api/quiz/submit` | 2번 |
| 거래 API | 매수/매도 처리 API 점검 | `src/app/api/trade` | 3번 |

> 브랜치는 나누지 않고 `main` 브랜치에서 직접 작업합니다.

> ⚠️ DB 테이블과 RLS가 준비된 뒤 API를 최종 점검합니다.

---

## 현재 이미 만들어진 것

| API | 경로 | 상태 |
|-----|------|------|
| 주가 조회 | `GET /api/stocks/[ticker]` | ✅ 완료 |
| 뉴스 목록 | `GET /api/learning/news` | ✅ 완료 |
| 뉴스 상세 | `GET /api/learning/news/[id]` | ✅ 완료 |
| 퀴즈 문제 생성 | `GET /api/learning/quiz/[newsId]` | ✅ 완료 |
| 시기별 퀴즈 피드 | `GET /api/learning/quiz-feed/[ticker]` | ✅ 완료 |
| 퀴즈 채점 | `POST /api/quiz/submit` | ✅ 완료 / 점검 필요 |
| 매수/매도 | `POST /api/trade` | ✅ 완료 / 점검 필요 |
| 뉴스 데이터 | `curated_news` 테이블 내용 | 보강 필요 |

---

## 1. 뉴스 데이터 수집 + source_url 자동 생성

목표: `curated_news` 테이블에 종목별 뉴스 데이터를 넣고, 기사 원문 링크(`source_url`)를 자동으로 채웁니다.

### source_url이란?

퀴즈 결과 화면에서 "기사 원문 읽기" 버튼을 누르면 열리는 뉴스 링크입니다.  
`curated_news.source_url` 컬럼에 저장됩니다.

### 자동 생성 방식

뉴스 제목 + 날짜로 네이버 뉴스 검색 URL을 자동 생성합니다.

```ts
function buildNaverSearchUrl(title: string, date: string): string {
  const [year, month, day] = date.split('-')
  const ds = `${year}.${month}.01`
  const de = `${year}.${month}.${day}`
  const query = encodeURIComponent(title.slice(0, 20))
  return `https://search.naver.com/search.naver?where=news&query=${query}&ds=${ds}&de=${de}`
}
```

### API로 자동화할 경우

예시 위치:

```text
src/app/api/admin/news/route.ts
```

이 API는 뉴스 제목과 날짜를 받아 `source_url`을 생성한 뒤 Supabase에 INSERT하는 용도로 만들 수 있습니다.

---

## 2. 퀴즈 채점 API 점검

파일:

```text
src/app/api/quiz/submit/route.ts
```

흐름:

```text
1. 요청한 사용자 인증 확인
2. curated_news 테이블에서 news_id로 뉴스 정보 조회
3. /api/learning/quiz/[newsId] 로직으로 정답 확인
4. 맞은 문제당 코인 지급
5. quiz_sessions 테이블에 결과 저장
6. users 테이블 coins 업데이트
7. 해당 종목 퀴즈를 3번 통과하면 투자 권한 해제 상태로 응답
```

---

## 3. 매수/매도 처리 API 점검

파일:

```text
src/app/api/trade/route.ts
```

흐름:

```text
1. 로그인한 사용자 확인
2. 해당 종목 투자 권한 확인
3. 현재 야후 주가 조회
4. 코인 계산
5. users 테이블 coins 업데이트
6. portfolio 테이블 업데이트
7. trades 테이블에 기록
```

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

# 작업 후
npm run build
git add .
git commit -m "feat: 작업 내용 설명"
git push origin main
```

push한 뒤 Vercel 배포와 실제 API 동작을 확인합니다.

---

## 파일 위치 규칙

| 파일 종류 | 올릴 위치 |
|----------|----------|
| API Route | `src/app/api` |
| 공통 함수, Supabase 연결 코드 | `src/lib` |
| TypeScript 타입 | `src/types` |
| 실제 실행할 DB SQL | `supabase/migrations` |
| 샘플 데이터 SQL | `supabase/seed.sql` |
| DB 설명 문서 | `docs/db` |
| 실제 환경변수 파일 `.env.local` | GitHub에 올리지 않음 |

---

## 완료 확인 체크리스트

- [ ] `curated_news` 데이터 보강
- [ ] `source_url` 생성 방식 확인
- [ ] 퀴즈 채점 API 정상 동작 확인
- [ ] 거래 API 정상 동작 확인
- [ ] `npm run build` 성공
- [ ] main push 완료
- [ ] Vercel 배포 확인
- [ ] 최원준에게 완료 알림
