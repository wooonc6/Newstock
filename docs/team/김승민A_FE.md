# 김승민A — API/FE 담당

## 담당 브랜치

| 브랜치 | 작업 내용 | 순서 |
|--------|----------|------|
| `feat/stock-price-ui` | yahoo-finance2 빌드 에러 수정 | 1번 ⚡ |
| `feat/news-feed-ui` | 퀴즈 화면 뉴스 피드 UI | 2번 |
| `feat/ranking-ui` | 랭킹 페이지 구현 | 3번 |

---

## 1. 빌드 에러 수정 (`feat/stock-price-ui`) — ⚡ 우선순위 1

`next.config.mjs` webpack 설정 수정
현재 `yahoo-finance2` Deno 의존성 에러 발생 중

수정 후 확인:
```bash
npm run dev  # 에러 없이 실행되면 완료
```

현재 `next.config.mjs` 파일 위치: 프로젝트 루트 (`Newstock/next.config.mjs`)

---

## 2. 퀴즈 화면 UI (`feat/news-feed-ui`)

파일: `src/app/(main)/quiz/[stock]/page.tsx`

구현 내용:
- 뉴스 기사 제목 / 날짜 표시
- "주가 상승" / "주가 하락" 선택 버튼 2개
- 정답 후 실제 주가 변동 결과 표시

> 디자인: `reference/design_reference.html` 퀴즈 탭 참고
> 파일 위치: `Newstock/reference/design_reference.html` → 브라우저로 열기

---

## 3. 랭킹 페이지 (`feat/ranking-ui`)

파일: `src/app/(main)/ranking/page.tsx`

구현 내용:
- 포트폴리오 수익률 기준 전체 순위
- 1~3위 메달 표시
- 내 순위 강조 표시

> 디자인: `reference/design_reference.html` 랭킹 탭 참고

---

## GitHub에 올리는 방법

### 0. 터미널(명령창) 여는 방법

**방법 A — VS Code 사용 (추천)**
1. VS Code 실행
2. 상단 메뉴 **Terminal → New Terminal** 클릭
3. 또는 단축키 **Ctrl + `** (백틱, 숫자 1 왼쪽 키)
4. 하단에 터미널 창이 열림

**방법 B — Windows 터미널 직접 사용**
1. 시작 메뉴에서 **"PowerShell"** 검색 후 실행

> 💡 VS Code에서 파일 탐색기(왼쪽 사이드바) + 편집기 + 터미널을 한 화면에서 쓸 수 있어서 편함

---

### 1. 처음 한 번만 — 레포 클론

> 이미 받았다면 건너뜀

```bash
# 원하는 폴더로 이동 (예: 바탕화면)
cd Desktop

# 레포 다운로드
git clone https://github.com/wooonc6/Newstock.git

# 프로젝트 폴더로 이동
cd Newstock

# 패키지 설치
npm install
```

### 환경변수 설정 (처음 한 번)

```bash
copy .env.example .env.local
```

VS Code에서 `.env.local` 열고 이은우한테 받은 Supabase URL/KEY 입력.

---

### 2. 첫 번째 브랜치 작업 (`feat/stock-price-ui`)

```bash
# 최신 코드 받기
git checkout main
git pull origin main

# 내 브랜치 만들기
git checkout -b feat/stock-price-ui

# 개발 서버 실행하여 에러 확인
npm run dev
```

에러 수정 후:

```bash
# 에러 없이 뜨는지 확인: http://localhost:3000

git add .
git commit -m "fix: yahoo-finance2 webpack 빌드 에러 수정"
git push origin feat/stock-price-ui
```

---

### 3. 두 번째 브랜치 작업 (`feat/news-feed-ui`)

```bash
git checkout main
git pull origin main
git checkout -b feat/news-feed-ui

# 개발 서버 실행 후 작업
npm run dev
# http://localhost:3000 에서 화면 확인하며 작업

git add .
git commit -m "feat: 퀴즈 뉴스 피드 UI 구현"
git push origin feat/news-feed-ui
```

---

### 4. 세 번째 브랜치 작업 (`feat/ranking-ui`)

```bash
git checkout main
git pull origin main
git checkout -b feat/ranking-ui

npm run dev

git add .
git commit -m "feat: 랭킹 페이지 구현"
git push origin feat/ranking-ui
```

---

### 5. PR(Pull Request) 올리기

> push 완료 후 GitHub 웹사이트에서 진행

1. 브라우저에서 **https://github.com/wooonc6/Newstock** 접속
2. 노란색 배너 **"Compare & pull request"** 버튼 클릭
   - 안 보이면 상단 **"Pull requests"** 탭 → **"New pull request"**
3. **base 브랜치**: `dev` 로 설정 (중요! `main` 아님)
4. **compare 브랜치**: 내가 올린 브랜치 확인
5. 제목 입력 후 **"Create pull request"** 클릭
6. 최원준에게 카톡으로 PR 링크 전달

> ⚠️ `main`에 직접 push 금지

---

### 디자인 레퍼런스 여는 방법

`reference/design_reference.html` 파일을 **파일 탐색기에서 더블클릭** → 브라우저에서 열림.
퀴즈/랭킹 탭 클릭해서 디자인 확인 후 그대로 구현.

---

## GitHub 브랜치 읽는 법

**https://github.com/wooonc6/Newstock/tree/feat/news-feed-ui** 접속하면 아래처럼 보임.

```
feat/news-feed-ui ▼   17 Branches

This branch is 28 commits behind main.          ← ① 정상. 의도적인 것
                                      [Contribute ▼]

wooonc6  feat: 퀴즈 뉴스 피드 UI 구현   🕐 3 Commits   ← ②

📁 src/                feat: 퀴즈 뉴스 피드 UI 구현    last week   ← ③
📄 .gitignore          Initial commit: Newstock...    2 weeks ago
```

**① "X commits behind main"**
→ main에 더 많은 커밋이 있다는 뜻. **문제 아님.** 내 브랜치엔 UI 관련 커밋만 있으면 됨.

**② 커밋 수 + 마지막 커밋 메시지**
→ 이 브랜치에 총 몇 개 커밋이 있는지, 가장 최근 커밋이 뭔지.

**③ 파일/폴더 목록 + 마지막으로 수정한 커밋**
→ 각 파일이 어느 커밋에서 바뀌었는지. 내가 커밋하면 여기에 표시됨.
→ `src` → `app` → `(main)` → `quiz` 폴더로 들어가면 내가 만든 파일 확인 가능.

---

### 이 프로젝트 폴더 구조 (FE 담당 관련)

```
Newstock/
├── src/
│   └── app/
│       └── (main)/                 ← 로그인 후 보이는 화면들
│           ├── quiz/
│           │   └── [stock]/
│           │       └── page.tsx    ← 내가 만들 파일 (퀴즈 화면 UI)
│           └── ranking/
│               └── page.tsx        ← 내가 만들 파일 (랭킹 페이지)
├── next.config.mjs                 ← 빌드 에러 수정 대상
└── reference/
    └── design_reference.html       ← 디자인 참고용 (브라우저로 열기)
```

> `(main)` 괄호 폴더는 URL에는 안 나타남. `/quiz/삼성전자`, `/ranking` 이런 식으로 접근됨.

---

### 완료 확인 체크리스트

- [ ] `npm run dev` 에러 없이 실행
- [ ] `feat/stock-price-ui` push + PR 완료
- [ ] 퀴즈 화면 UI 구현 완료
- [ ] `feat/news-feed-ui` push + PR 완료
- [ ] 랭킹 페이지 구현 완료
- [ ] `feat/ranking-ui` push + PR 완료
