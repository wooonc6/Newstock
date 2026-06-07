# 김성준 — Backend 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/news-collector` | curated_news 데이터 수집 + source_url 자동 생성 | **1번 ⚡** |
| `feat/unlock-backend` | 퀴즈 채점 + 현금 지급 API | 2번 |
| `feat/trade-logic` | 매수/매도 처리 API | 3번 |

> ⚠️ 이은우가 DB 테이블 생성 완료한 후 시작하세요

---

## 현재 이미 만들어진 것 (참고용)

| API | 경로 | 상태 |
|-----|------|------|
| 주가 조회 | `GET /api/stocks/[ticker]` | ✅ 완료 |
| 뉴스 목록 | `GET /api/learning/news` | ✅ 완료 |
| 뉴스 상세 | `GET /api/learning/news/[id]` | ✅ 완료 |
| 퀴즈 문제 생성 | `GET /api/learning/quiz/[newsId]` | ✅ 완료 |
| 시기별 퀴즈 피드 | `GET /api/learning/quiz-feed/[ticker]` | ✅ 완료 |
| **퀴즈 채점** | `POST /api/quiz/submit` | ✅ 완료 |
| **매수/매도** | `POST /api/trade` | ✅ 완료 |
| **뉴스 데이터** | `curated_news` 테이블 내용 | ❌ **비어있음 — 최우선 작업** |

---

## 1. 뉴스 데이터 수집 + source_url 자동 생성 (`feat/news-collector`) ⚡ 최우선

**목표**: `curated_news` 테이블에 종목별 뉴스 데이터를 넣고, 기사 원문 링크(`source_url`)를 자동으로 채운다.

### source_url이 뭔가요?

퀴즈 결과 화면에서 "📰 기사 원문 읽기 →" 버튼을 누르면 열리는 뉴스 링크.  
`curated_news.source_url` 컬럼에 저장되며, **없어도 앱은 동작하지만 버튼이 안 보임**.

### 자동 생성 방식 (네이버 검색 URL)

뉴스 제목 + 날짜로 네이버 뉴스 검색 URL을 자동 생성하면 됨. 직접 기사 URL을 찾을 필요 없음.

```ts
function buildNaverSearchUrl(title: string, date: string): string {
  // date 형식: "2024-01-15"
  const [year, month, day] = date.split('-');
  const ds = `${year}.${month}.01`;         // 해당 월 1일부터
  const de = `${year}.${month}.${day}`;     // 기사 날짜까지
  const query = encodeURIComponent(title.slice(0, 20)); // 제목 앞 20자로 검색
  return `https://search.naver.com/search.naver?where=news&query=${query}&ds=${ds}&de=${de}`;
}
```

### curated_news에 뉴스 INSERT 시 사용법

Supabase SQL Editor에서 뉴스 넣을 때 source_url 컬럼도 같이 채우면 됨:

```sql
insert into curated_news (title, company, ticker, news_date, category, difficulty, source_url) values
('삼성전자, HBM3 양산 성공… 엔비디아에 공급 임박', '삼성전자', '005930.KS', '2024-01-15', 'IT', 'easy',
 'https://search.naver.com/search.naver?where=news&query=삼성전자+HBM3+양산&ds=2024.01.01&de=2024.01.15'),

('SK하이닉스, HBM3E 독점 공급 확정', 'SK하이닉스', '000660.KS', '2024-03-05', 'IT', 'medium',
 'https://search.naver.com/search.naver?where=news&query=SK하이닉스+HBM3E+독점&ds=2024.03.01&de=2024.03.05');
```

### 또는 API로 자동화 (선택사항)

`src/app/api/admin/news/route.ts` 를 만들어서 뉴스 제목과 날짜를 받으면 source_url을 자동 생성해서 DB에 넣는 내부 API를 만들어도 됨:

```ts
// POST /api/admin/news
// body: { title, company, ticker, news_date, category, difficulty }
// → source_url 자동 생성 후 curated_news에 INSERT
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, company, ticker, news_date, category, difficulty } = body;

  const [year, month, day] = news_date.split('-');
  const source_url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(title.slice(0, 20))}&ds=${year}.${month}.01&de=${year}.${month}.${day}`;

  const supabase = await createClient();
  await supabase.from('curated_news').insert({
    title, company, ticker, news_date, category, difficulty, source_url
  });

  return NextResponse.json({ ok: true, source_url });
}
```

### 최소 필요 데이터량

9개 종목 × 각 3개 뉴스 = **27개** 정도면 퀴즈가 풍부하게 돌아감.  
이은우가 넣어준 샘플 9개에 source_url만 추가해도 당장 테스트 가능.

---

## 2. 퀴즈 채점 + 현금 지급 (`feat/unlock-backend`)

**만들어야 할 파일**: `src/app/api/quiz/submit/route.ts`

```
POST /api/quiz/submit
body: { news_id, stock_ticker, answers: [{ months, selected_index }] }

흐름:
1. 요청한 사용자 인증 확인
2. curated_news 테이블에서 news_id로 뉴스 정보 조회
3. /api/learning/quiz/[newsId] 로직으로 정답 확인
4. 맞은 문제당 코인 지급 (1개월: 10코인, 3개월: 20코인, 6개월: 30코인)
5. quiz_sessions 테이블에 결과 저장
6. users 테이블 coins 업데이트
7. 해당 종목 퀴즈를 3번 통과하면 투자 권한 해제 상태로 응답
```

**코드 골격**:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { news_id, stock_ticker, answers } = await req.json()
  // answers: [{ months: 1, selected_index: 2 }, ...]

  // 2. 퀴즈 정답 조회
  const res = await fetch(`${req.nextUrl.origin}/api/learning/quiz/${news_id}`)
  const quizData = await res.json()

  // 3. 채점
  let coinsEarned = 0
  let correctCount = 0
  for (const ans of answers) {
    const period = quizData.periods.find((p: any) => p.months === ans.months)
    if (!period) continue
    if (period.answerIndex === ans.selected_index) {
      correctCount++
      coinsEarned += period.coins
    }
  }

  // 4. quiz_sessions 저장
  await supabase.from('quiz_sessions').insert({
    user_id: user.id,
    stock_ticker,
    news_id,
    score: correctCount,
    total: answers.length,
    coins_earned: coinsEarned,
  })

  // 5. 코인 업데이트
  await supabase.rpc('increment_coins', { user_id: user.id, amount: coinsEarned })
  // 또는: await supabase.from('users').update({ coins: supabase.rpc(...) })

  // 6. 언락 여부 확인
  const { count } = await supabase
    .from('quiz_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('stock_ticker', stock_ticker)

  return NextResponse.json({
    correct: correctCount,
    total: answers.length,
    coinsEarned,
    unlocked: (count ?? 0) >= 3,
  })
}
```

> 힌트: `supabase.rpc('increment_coins', ...)` 대신 현재 coins를 먼저 조회한 뒤 +coinsEarned해서 update해도 됩니다.

---

## 2. 매수/매도 처리 (`feat/trade-logic`)

**만들어야 할 파일**: `src/app/api/trade/route.ts`

```
POST /api/trade
body: { ticker, type: 'buy' | 'sell', quantity }

흐름:
1. 로그인한 사용자 확인
2. 해당 종목 투자 권한 확인 (quiz_sessions에서 3번 이상 풀었는지)
3. 현재 야후 주가 조회 (/api/stocks/[ticker])
4. 코인 계산: buy → 코인 차감, sell → 코인 증가
5. users 테이블 coins 업데이트
6. portfolio 테이블 업데이트 (avg_cost 계산)
7. trades 테이블에 기록
```

**코드 골격**:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { ticker, type, quantity } = await req.json()

  // 투자 권한 확인
  const { count } = await supabase
    .from('quiz_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('stock_ticker', ticker)

  if ((count ?? 0) < 3) {
    return NextResponse.json({ error: '퀴즈를 3번 이상 완료해야 거래할 수 있습니다.' }, { status: 403 })
  }

  // 현재 주가 조회
  const priceRes = await fetch(`${req.nextUrl.origin}/api/stocks/${encodeURIComponent(ticker)}`)
  const priceData = await priceRes.json()
  const price = priceData.price

  const coinsDelta = Math.round(price * quantity)

  // 유저 코인 확인
  const { data: userData } = await supabase.from('users').select('coins').eq('id', user.id).single()
  if (type === 'buy' && (userData?.coins ?? 0) < coinsDelta) {
    return NextResponse.json({ error: '코인이 부족합니다.' }, { status: 400 })
  }

  // 코인 업데이트
  const newCoins = type === 'buy'
    ? (userData?.coins ?? 0) - coinsDelta
    : (userData?.coins ?? 0) + coinsDelta
  await supabase.from('users').update({ coins: newCoins }).eq('id', user.id)

  // portfolio 업데이트
  const { data: existing } = await supabase
    .from('portfolio').select('*').eq('user_id', user.id).eq('ticker', ticker).single()

  if (type === 'buy') {
    if (existing) {
      const totalQty = existing.quantity + quantity
      const avgCost = (existing.avg_cost * existing.quantity + price * quantity) / totalQty
      await supabase.from('portfolio')
        .update({ quantity: totalQty, avg_cost: avgCost, updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('ticker', ticker)
    } else {
      await supabase.from('portfolio')
        .insert({ user_id: user.id, ticker, quantity, avg_cost: price, updated_at: new Date().toISOString() })
    }
  } else {
    const newQty = (existing?.quantity ?? 0) - quantity
    if (newQty <= 0) {
      await supabase.from('portfolio').delete().eq('user_id', user.id).eq('ticker', ticker)
    } else {
      await supabase.from('portfolio')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('ticker', ticker)
    }
  }

  // 거래 기록
  await supabase.from('trades').insert({
    user_id: user.id,
    ticker,
    trade_type: type,
    quantity,
    price,
    coins_delta: type === 'buy' ? -coinsDelta : coinsDelta,
  })

  return NextResponse.json({ success: true, newCoins, price, quantity })
}
```

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. **Terminal → New Terminal** (또는 `Ctrl + \``)

**방법 B — Windows PowerShell**
1. 시작 메뉴 → "PowerShell" 검색 후 실행

---

### 1. 처음 한 번만 — 레포 클론

```bash
cd Desktop
git clone https://github.com/wooonc6/Newstock.git
cd Newstock
npm install
```

### 환경변수 설정 (처음 한 번)

`.env.local` 파일을 만들고 아래 내용 붙여넣기:

```
NEXT_PUBLIC_SUPABASE_URL=https://zsdhvaylgwmmohecrsfs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGh2YXlsZ3dtbW9oZWNyc2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjA4NDMsImV4cCI6MjA5NTk5Njg0M30.BToEhlrcf5v4V0B07zQTOGULs56BUDEWecEBtJSNcRY
```

---

### 2. 브랜치 만들기

```bash
git checkout main
git pull origin main
git checkout -b feat/unlock-backend
```

코드 작성 후:

```bash
# 로컬에서 테스트
npm run dev
# 브라우저에서 http://localhost:3000 확인

# GitHub에 올리기 (main에 바로 push → Vercel 자동 배포)
git add .
git commit -m "feat: 퀴즈 채점 및 코인 지급 API"
git push origin main
```

---

### 3. 두 번째 브랜치

```bash
git checkout main
git pull origin main
git checkout -b feat/trade-logic

# 작업 후
git add .
git commit -m "feat: 매수/매도 처리 API"
git push origin main
```

---

## 이 프로젝트 폴더 구조 (Backend 담당 관련)

```
Newstock/
└── src/
    └── app/
        └── api/                          ← API Route 전부 여기에
            ├── learning/
            │   ├── news/
            │   │   ├── route.ts          ✅ 뉴스 목록 (완료)
            │   │   └── [id]/route.ts     ✅ 뉴스 상세 (완료)
            │   └── quiz/
            │       └── [newsId]/route.ts ✅ 퀴즈 문제 생성 (완료)
            ├── quiz/
            │   └── submit/
            │       └── route.ts          ❌ 내가 만들 파일 (채점)
            ├── trade/
            │   └── route.ts              ❌ 내가 만들 파일 (매수/매도)
            └── stocks/
                └── [ticker]/route.ts     ✅ 야후 주가 조회 (완료)
```

> `src/app/api/` 안에 폴더명이 곧 URL 경로.
> `api/quiz/submit/route.ts` → `POST /api/quiz/submit` 로 호출됨.

---

## 완료 확인 체크리스트

- [ ] 이은우 DB 테이블 생성 완료 확인 후 시작
- [ ] `.env.local` 설정 완료
- [ ] `npm run dev` 실행 후 http://localhost:3000 정상 확인
- [ ] **`curated_news`에 종목별 뉴스 최소 9개 이상 INSERT** ← 최우선
- [ ] INSERT 시 source_url 자동 생성 확인 (기사 원문 버튼 동작)
- [ ] `feat/news-collector` 브랜치 push 완료
- [ ] `/api/quiz/submit` → ✅ 이미 완료
- [ ] `/api/trade` → ✅ 이미 완료
- [ ] 최원준에게 완료 알림
