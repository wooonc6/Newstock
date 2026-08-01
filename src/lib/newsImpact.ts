import "server-only";

export const IMPACT_TRADING_DAYS = 3;
export const MIN_QUIZ_CHANGE_PERCENT = 0.5;
export const MAX_NEWS_PER_QUIZ = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

export const QUIZ_AGE_BRACKETS = [
  { label: "약 1개월 전", targetMonths: 1, minDaysAgo: 14, maxDaysAgo: 60, coins: 50000 },
  { label: "약 3개월 전", targetMonths: 3, minDaysAgo: 61, maxDaysAgo: 135, coins: 100000 },
  { label: "약 6개월 전", targetMonths: 6, minDaysAgo: 136, maxDaysAgo: 270, coins: 150000 },
  {
    label: "12개월 이상 전",
    targetMonths: 12,
    minDaysAgo: 271,
    maxDaysAgo: Number.POSITIVE_INFINITY,
    coins: 200000,
  },
] as const;

export type QuizDirection = "up" | "down";

export type QuizAgeBracket = (typeof QUIZ_AGE_BRACKETS)[number];

export type NewsImpact = {
  baseDate: string;
  basePrice: number;
  impactDate: string;
  impactPrice: number;
  changeRate: number;
  direction: QuizDirection;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: { gmtoffset?: number };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      description?: string;
    } | null;
  };
};

type PricePoint = {
  date: string;
  price: number;
};

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftUtcDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function getSeoulDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getQuizAgeBracket(
  newsDate: string,
  referenceDate = new Date()
): QuizAgeBracket | null {
  const news = parseDateOnly(newsDate);
  const today = parseDateOnly(getSeoulDateString(referenceDate));

  if (Number.isNaN(news.getTime())) return null;

  const daysAgo = Math.floor((today.getTime() - news.getTime()) / DAY_MS);

  return (
    QUIZ_AGE_BRACKETS.find(
      (bracket) => daysAgo >= bracket.minDaysAgo && daysAgo <= bracket.maxDaysAgo
    ) ?? null
  );
}

export function buildCuratedNewsSourceUrl(title: string, newsDate: string): string {
  const [year, month, day] = newsDate.split("-");
  const query = encodeURIComponent(title.slice(0, 30));
  const ds = `${year}.${month}.${day}`;

  return `https://search.naver.com/search.naver?where=news&query=${query}&ds=${ds}&de=${ds}`;
}

export function isQuizWorthyImpact(impact: NewsImpact): boolean {
  return Math.abs(impact.changeRate) >= MIN_QUIZ_CHANGE_PERCENT;
}

export async function getNewsImpact(ticker: string, newsDate: string): Promise<NewsImpact> {
  const articleDate = parseDateOnly(newsDate);

  if (Number.isNaN(articleDate.getTime())) {
    throw new Error("뉴스 날짜 형식이 올바르지 않습니다.");
  }

  const periodStart = shiftUtcDays(articleDate, -14);
  const periodEnd = shiftUtcDays(articleDate, 21);
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`
  );

  url.searchParams.set("period1", String(Math.floor(periodStart.getTime() / 1000)));
  url.searchParams.set("period2", String(Math.floor(periodEnd.getTime() / 1000)));
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "history");
  url.searchParams.set("includeAdjustedClose", "true");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 Newstock/1.0",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  const payload = (await response.json().catch(() => null)) as YahooChartResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.chart?.error?.description || `Yahoo Finance 응답 오류 (${response.status})`
    );
  }

  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const timezoneOffset = result?.meta?.gmtoffset ?? 0;
  const pointsByDate = new Map<string, PricePoint>();

  timestamps.forEach((timestamp, index) => {
    const close = closes[index];
    if (typeof close !== "number" || !Number.isFinite(close)) return;

    const localDate = formatDateOnly(new Date((timestamp + timezoneOffset) * 1000));
    pointsByDate.set(localDate, { date: localDate, price: close });
  });

  const points = Array.from(pointsByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const basePoint = points.filter((point) => point.date < newsDate).at(-1);
  const impactPoint = points.filter((point) => point.date > newsDate)[IMPACT_TRADING_DAYS - 1];

  if (!basePoint) {
    throw new Error("기사 발표 직전 거래일의 종가를 찾을 수 없습니다.");
  }

  if (!impactPoint) {
    throw new Error(`기사 발표 후 ${IMPACT_TRADING_DAYS}거래일 종가를 찾을 수 없습니다.`);
  }

  const changeRate = ((impactPoint.price - basePoint.price) / basePoint.price) * 100;

  return {
    baseDate: basePoint.date,
    basePrice: basePoint.price,
    impactDate: impactPoint.date,
    impactPrice: impactPoint.price,
    changeRate,
    direction: changeRate >= 0 ? "up" : "down",
  };
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}
