import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.105.4";

const NEWS_API_URL = "https://newstock-xi.vercel.app/api/news";
const MAX_ACTIVE_PER_STOCK = 15;
const MIN_CHANGE_PERCENT = 0.5;
const IMPACT_TRADING_DAYS = 3;
const MAX_ARTICLE_AGE_DAYS = 730;
const STOCKS_PER_BATCH = 5;
const BATCH_COUNT = Math.ceil(30 / STOCKS_PER_BATCH);
const DAY_MS = 24 * 60 * 60 * 1000;

type Direction = "up" | "down";

type StockDefinition = {
  ticker: string;
  company: string;
  search: string;
  aliases: string[];
};

type NewsApiItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  tag: string;
};

type Candidate = NewsApiItem & {
  newsDate: string;
  publishedAt: string;
};

type PricePoint = {
  date: string;
  price: number;
};

type EvaluatedArticle = Candidate & {
  category: string;
  difficulty: "easy" | "medium" | "hard";
  baseDate: string;
  basePrice: number;
  impactDate: string;
  impactPrice: number;
  changeRate: number;
  direction: Direction;
};

type ExistingArticleRow = {
  title: string;
  description: string | null;
  source_url: string | null;
  news_date: string;
  published_at: string | null;
  category: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  impact_base_date: string | null;
  impact_base_price: number | null;
  impact_date: string | null;
  impact_price: number | null;
  impact_change: number | null;
  impact_direction: Direction | null;
};

type StockSyncResult = {
  ticker: string;
  company: string;
  found: number;
  active: number;
  error?: string;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: { gmtoffset?: number };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

const STOCKS: StockDefinition[] = [
  { ticker: "005930.KS", company: "삼성전자", search: "삼성전자", aliases: ["삼성전자"] },
  { ticker: "000660.KS", company: "SK하이닉스", search: "SK하이닉스", aliases: ["sk하이닉스", "에스케이하이닉스"] },
  { ticker: "042700.KS", company: "한미반도체", search: "한미반도체", aliases: ["한미반도체"] },
  { ticker: "267260.KS", company: "HD현대일렉트릭", search: "HD현대일렉트릭", aliases: ["hd현대일렉트릭", "현대일렉트릭"] },
  { ticker: "010120.KS", company: "LS ELECTRIC", search: "LS일렉트릭", aliases: ["ls일렉트릭", "ls electric"] },
  { ticker: "298040.KS", company: "효성중공업", search: "효성중공업", aliases: ["효성중공업"] },
  { ticker: "329180.KS", company: "HD현대중공업", search: "HD현대중공업", aliases: ["hd현대중공업", "현대중공업"] },
  { ticker: "042660.KS", company: "한화오션", search: "한화오션", aliases: ["한화오션", "대우조선해양"] },
  { ticker: "010140.KS", company: "삼성중공업", search: "삼성중공업", aliases: ["삼성중공업"] },
  { ticker: "012450.KS", company: "한화에어로스페이스", search: "한화에어로스페이스", aliases: ["한화에어로스페이스"] },
  { ticker: "047810.KS", company: "한국항공우주", search: "한국항공우주 KAI", aliases: ["한국항공우주", "kai"] },
  { ticker: "064350.KS", company: "현대로템", search: "현대로템", aliases: ["현대로템"] },
  { ticker: "034020.KS", company: "두산에너빌리티", search: "두산에너빌리티", aliases: ["두산에너빌리티", "두산중공업"] },
  { ticker: "015760.KS", company: "한국전력", search: "한국전력", aliases: ["한국전력", "한전"] },
  { ticker: "000720.KS", company: "현대건설", search: "현대건설", aliases: ["현대건설"] },
  { ticker: "373220.KS", company: "LG에너지솔루션", search: "LG에너지솔루션", aliases: ["lg에너지솔루션", "lg엔솔"] },
  { ticker: "006400.KS", company: "삼성SDI", search: "삼성SDI", aliases: ["삼성sdi"] },
  { ticker: "005490.KS", company: "POSCO홀딩스", search: "포스코홀딩스", aliases: ["포스코홀딩스", "posco홀딩스"] },
  { ticker: "005380.KS", company: "현대차", search: "현대차", aliases: ["현대차", "현대자동차"] },
  { ticker: "000270.KS", company: "기아", search: "기아 자동차", aliases: ["기아", "kia"] },
  { ticker: "012330.KS", company: "현대모비스", search: "현대모비스", aliases: ["현대모비스"] },
  { ticker: "207940.KS", company: "삼성바이오로직스", search: "삼성바이오로직스", aliases: ["삼성바이오로직스", "삼성바이오"] },
  { ticker: "068270.KS", company: "셀트리온", search: "셀트리온", aliases: ["셀트리온"] },
  { ticker: "000100.KS", company: "유한양행", search: "유한양행", aliases: ["유한양행"] },
  { ticker: "105560.KS", company: "KB금융", search: "KB금융", aliases: ["kb금융", "케이비금융"] },
  { ticker: "055550.KS", company: "신한지주", search: "신한지주", aliases: ["신한지주", "신한금융"] },
  { ticker: "086790.KS", company: "하나금융지주", search: "하나금융지주", aliases: ["하나금융지주", "하나금융"] },
  { ticker: "035420.KS", company: "NAVER", search: "네이버 기업 주가", aliases: ["네이버", "naver"] },
  { ticker: "035720.KS", company: "카카오", search: "카카오 기업 주가", aliases: ["카카오"] },
  { ticker: "259960.KS", company: "크래프톤", search: "크래프톤", aliases: ["크래프톤"] },
];

const BRACKETS = [
  { minDaysAgo: 14, maxDaysAgo: 60, quota: 4 },
  { minDaysAgo: 61, maxDaysAgo: 135, quota: 4 },
  { minDaysAgo: 136, maxDaysAgo: 270, quota: 4 },
  { minDaysAgo: 271, maxDaysAgo: MAX_ARTICLE_AGE_DAYS, quota: 3 },
] as const;

function seoulDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysAgo(date: string, referenceDate = seoulDate()): number {
  const articleTime = new Date(`${date}T00:00:00.000Z`).getTime();
  const referenceTime = new Date(`${referenceDate}T00:00:00.000Z`).getTime();
  return Math.floor((referenceTime - articleTime) / DAY_MS);
}

function articleDate(pubDate: string): string | null {
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return seoulDate(parsed);
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|fbclid$|gclid$|ncid$)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isRelevant(stock: StockDefinition, item: NewsApiItem): boolean {
  // A company name mentioned only in the summary can be incidental context
  // (for example, a construction project located at Samsung's campus). Quiz
  // news must name the target company in the headline so the stock whose price
  // we score is actually one of the article's main subjects.
  const title = item.title.toLowerCase();
  return stock.aliases.some((alias) => title.includes(alias.toLowerCase()));
}

async function fetchNewsPage(
  query: string,
  sort: "date" | "sim",
  start: number,
  retryCount = 0,
) {
  const url = new URL(NEWS_API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("display", "100");
  url.searchParams.set("start", String(start));
  url.searchParams.set("sort", sort);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Newstock-News-Sync/1.0" },
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 429 && retryCount < 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return fetchNewsPage(query, sort, start, retryCount + 1);
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `뉴스 API 오류 (${response.status})`);
  }

  return Array.isArray(payload?.items) ? (payload.items as NewsApiItem[]) : [];
}

async function collectCandidates(stock: StockDefinition): Promise<Candidate[]> {
  const currentYear = Number(seoulDate().slice(0, 4));
  const previousYear = currentYear - 1;
  const twoYearsAgo = currentYear - 2;
  const queryPlans = [
    { query: stock.search, sort: "date" as const, starts: [1] },
    { query: stock.search, sort: "sim" as const, starts: [901] },
    {
      query: `${stock.search} ${previousYear} 실적 발표`,
      sort: "sim" as const,
      starts: [1, 401, 901],
    },
    {
      query: `${stock.search} ${previousYear} 투자 수주 계약`,
      sort: "sim" as const,
      starts: [401, 901],
    },
    {
      query: `${stock.search} ${twoYearsAgo} 실적 투자`,
      sort: "sim" as const,
      starts: [901],
    },
  ];

  const byUrl = new Map<string, Candidate>();

  for (const plan of queryPlans) {
    for (const start of plan.starts) {
      let items: NewsApiItem[];
      try {
        items = await fetchNewsPage(plan.query, plan.sort, start);
      } catch {
        continue;
      }

      for (const item of items) {
        if (!item?.title || !item?.link || !item?.pubDate || !isRelevant(stock, item)) continue;

        const link = normalizeUrl(item.link);
        const newsDate = articleDate(item.pubDate);
        if (!link || !newsDate) continue;

        const age = daysAgo(newsDate);
        if (age < 14 || age > MAX_ARTICLE_AGE_DAYS) continue;

        const publishedAt = new Date(item.pubDate).toISOString();
        byUrl.set(link, { ...item, link, newsDate, publishedAt });
      }
    }
  }

  return Array.from(byUrl.values());
}

async function fetchPriceHistory(ticker: string): Promise<PricePoint[]> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 7);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (MAX_ARTICLE_AGE_DAYS + 30));

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set("period1", String(Math.floor(start.getTime() / 1000)));
  url.searchParams.set("period2", String(Math.floor(end.getTime() / 1000)));
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "history");
  url.searchParams.set("includeAdjustedClose", "true");

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Newstock-News-Sync/1.0" },
  });
  const payload = (await response.json().catch(() => null)) as YahooChartResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.chart?.error?.description ?? `Yahoo Finance 오류 (${response.status})`,
    );
  }

  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const offset = result?.meta?.gmtoffset ?? 0;
  const byDate = new Map<string, PricePoint>();

  timestamps.forEach((timestamp, index) => {
    const close = closes[index];
    if (typeof close !== "number" || !Number.isFinite(close)) return;
    const date = new Date((timestamp + offset) * 1000).toISOString().slice(0, 10);
    byDate.set(date, { date, price: close });
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function evaluateCandidate(candidate: Candidate, points: PricePoint[]): EvaluatedArticle | null {
  const basePoint = points.filter((point) => point.date < candidate.newsDate).at(-1);
  const impactPoint = points.filter((point) => point.date > candidate.newsDate)[IMPACT_TRADING_DAYS - 1];
  if (!basePoint || !impactPoint) return null;

  const changeRate = ((impactPoint.price - basePoint.price) / basePoint.price) * 100;
  if (Math.abs(changeRate) < MIN_CHANGE_PERCENT) return null;

  const magnitude = Math.abs(changeRate);
  const difficulty = magnitude < 2 ? "easy" : magnitude < 5 ? "medium" : "hard";

  return {
    ...candidate,
    category: candidate.tag || "시장동향",
    difficulty,
    baseDate: basePoint.date,
    basePrice: basePoint.price,
    impactDate: impactPoint.date,
    impactPrice: impactPoint.price,
    changeRate,
    direction: changeRate >= 0 ? "up" : "down",
  };
}

function existingToEvaluated(row: ExistingArticleRow): EvaluatedArticle | null {
  if (
    !row.source_url ||
    !row.published_at ||
    !row.impact_base_date ||
    row.impact_base_price == null ||
    !row.impact_date ||
    row.impact_price == null ||
    row.impact_change == null ||
    !row.impact_direction ||
    Math.abs(row.impact_change) < MIN_CHANGE_PERCENT
  ) {
    return null;
  }

  const age = daysAgo(row.news_date);
  if (age < 14 || age > MAX_ARTICLE_AGE_DAYS) return null;

  return {
    title: row.title,
    description: row.description ?? "",
    link: row.source_url,
    pubDate: row.published_at,
    tag: row.category ?? "시장동향",
    newsDate: row.news_date,
    publishedAt: row.published_at,
    category: row.category ?? "시장동향",
    difficulty: row.difficulty ?? "medium",
    baseDate: row.impact_base_date,
    basePrice: Number(row.impact_base_price),
    impactDate: row.impact_date,
    impactPrice: Number(row.impact_price),
    changeRate: Number(row.impact_change),
    direction: row.impact_direction,
  };
}

function chooseBalanced(items: EvaluatedArticle[]): EvaluatedArticle[] {
  const unique = new Map<string, EvaluatedArticle>();
  for (const item of items) {
    const previous = unique.get(item.link);
    if (!previous || item.newsDate > previous.newsDate) {
      unique.set(item.link, item);
    }
  }

  const available = Array.from(unique.values()).sort((a, b) => {
    const magnitudeDifference = Math.abs(b.changeRate) - Math.abs(a.changeRate);
    return magnitudeDifference !== 0
      ? magnitudeDifference
      : b.newsDate.localeCompare(a.newsDate);
  });
  const selected: EvaluatedArticle[] = [];
  const selectedKeys = new Set<string>();

  for (const bracket of BRACKETS) {
    const matches = available
      .filter((item) => {
        const age = daysAgo(item.newsDate);
        return age >= bracket.minDaysAgo && age <= bracket.maxDaysAgo;
      })
      .slice(0, bracket.quota);

    for (const item of matches) {
      const key = item.link;
      selected.push(item);
      selectedKeys.add(key);
    }
  }

  for (const item of available) {
    if (selected.length >= MAX_ACTIVE_PER_STOCK) break;
    const key = item.link;
    if (selectedKeys.has(key)) continue;
    selected.push(item);
    selectedKeys.add(key);
  }

  return selected
    .slice(0, MAX_ACTIVE_PER_STOCK)
    .sort((a, b) => b.newsDate.localeCompare(a.newsDate));
}

async function syncStock(
  stock: StockDefinition,
  admin: ReturnType<typeof createClient>,
): Promise<StockSyncResult> {
  try {
    const [candidates, points, existingResult] = await Promise.all([
      collectCandidates(stock),
      fetchPriceHistory(stock.ticker),
      admin
        .from("curated_news")
        .select(
          "title, description, source_url, news_date, published_at, category, difficulty, impact_base_date, impact_base_price, impact_date, impact_price, impact_change, impact_direction",
        )
        .eq("ticker", stock.ticker)
        .not("source_url", "is", null)
        .limit(100),
    ]);

    if (existingResult.error) throw existingResult.error;

    const evaluated = candidates
      .map((candidate) => evaluateCandidate(candidate, points))
      .filter((item): item is EvaluatedArticle => item !== null);
    const existing = ((existingResult.data ?? []) as ExistingArticleRow[])
      .filter((item) =>
        isRelevant(stock, {
          title: item.title,
          description: item.description ?? "",
          link: item.source_url ?? "",
          pubDate: item.published_at ?? "",
          tag: item.category ?? "시장동향",
        })
      )
      .map(existingToEvaluated)
      .filter((item): item is EvaluatedArticle => item !== null);
    const selected = chooseBalanced([...evaluated, ...existing]);

    if (selected.length === 0) {
      return { ticker: stock.ticker, company: stock.company, found: candidates.length, active: 0 };
    }

    const now = new Date().toISOString();
    const rows = selected.map((item) => ({
      title: item.title,
      company: stock.company,
      ticker: stock.ticker,
      news_date: item.newsDate,
      category: item.category,
      difficulty: item.difficulty,
      source_url: item.link,
      description: item.description,
      published_at: item.publishedAt,
      is_active: true,
      impact_days: IMPACT_TRADING_DAYS,
      impact_base_date: item.baseDate,
      impact_base_price: item.basePrice,
      impact_date: item.impactDate,
      impact_price: item.impactPrice,
      impact_change: item.changeRate,
      impact_direction: item.direction,
      last_verified_at: now,
    }));

    const { data: upserted, error: upsertError } = await admin
      .from("curated_news")
      .upsert(rows, { onConflict: "ticker,source_url" })
      .select("id");
    if (upsertError) throw upsertError;

    const selectedIds = (upserted ?? []).map((row) => row.id);
    if (selectedIds.length === 0) throw new Error("활성화할 뉴스 ID를 받지 못했습니다.");

    const { error: deactivateError } = await admin
      .from("curated_news")
      .update({ is_active: false })
      .eq("ticker", stock.ticker);
    if (deactivateError) throw deactivateError;

    const { error: activateError } = await admin
      .from("curated_news")
      .update({ is_active: true })
      .in("id", selectedIds);
    if (activateError) throw activateError;

    return {
      ticker: stock.ticker,
      company: stock.company,
      found: candidates.length,
      active: selectedIds.length,
    };
  } catch (error) {
    return {
      ticker: stock.ticker,
      company: stock.company,
      found: 0,
      active: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, run),
  );
  return results;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Supabase server configuration is missing." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const body = await request.json().catch(() => ({}));
  const batchIndex = Number(body?.batch_index);
  if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= BATCH_COUNT) {
    return Response.json(
      { error: `batch_index must be an integer from 0 to ${BATCH_COUNT - 1}.` },
      { status: 400 },
    );
  }

  const targetStocks = STOCKS.slice(
    batchIndex * STOCKS_PER_BATCH,
    (batchIndex + 1) * STOCKS_PER_BATCH,
  );

  if (batchIndex === 0) {
    const activeTickers = new Set(STOCKS.map((stock) => stock.ticker));
    const { data: activeRows, error: activeRowsError } = await admin
      .from("curated_news")
      .select("id, ticker")
      .eq("is_active", true)
      .limit(1000);
    if (activeRowsError) {
      return Response.json({ error: activeRowsError.message }, { status: 500 });
    }

    const obsoleteIds = (activeRows ?? [])
      .filter((row) => !activeTickers.has(row.ticker))
      .map((row) => row.id);
    if (obsoleteIds.length > 0) {
      const { error: deactivateObsoleteError } = await admin
        .from("curated_news")
        .update({ is_active: false })
        .in("id", obsoleteIds);
      if (deactivateObsoleteError) {
        return Response.json({ error: deactivateObsoleteError.message }, { status: 500 });
      }
    }
  }

  const syncDate = seoulDate();
  const { data: existingRun, error: existingRunError } = await admin
    .from("news_sync_runs")
    .select("id, status")
    .eq("sync_date", syncDate)
    .eq("batch_index", batchIndex)
    .maybeSingle();

  if (existingRunError) {
    return Response.json({ error: existingRunError.message }, { status: 500 });
  }

  if (existingRun?.status === "success" || existingRun?.status === "running") {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "already-synced",
      syncDate,
      batchIndex,
    });
  }

  let runId = existingRun?.id as string | undefined;
  if (runId) {
    const { error } = await admin
      .from("news_sync_runs")
      .update({ status: "running", started_at: new Date().toISOString(), error: null })
      .eq("id", runId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await admin
      .from("news_sync_runs")
      .insert({ sync_date: syncDate, batch_index: batchIndex, status: "running" })
      .select("id")
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    runId = data.id;
  }

  if (!runId) {
    return Response.json({ error: "뉴스 수집 실행 ID를 만들지 못했습니다." }, { status: 500 });
  }

  try {
    const results = await mapWithConcurrency(targetStocks, 1, (stock) => syncStock(stock, admin));
    const activeNewsCount = results.reduce((sum, result) => sum + result.active, 0);
    const failures = results.filter((result) => result.error);
    const status = failures.length === targetStocks.length ? "failed" : "success";

    const { error: finishError } = await admin
      .from("news_sync_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        active_news_count: activeNewsCount,
        summary: { batchIndex, stocks: results, failedStocks: failures.length },
        error: failures.length > 0 ? `${failures.length}개 종목 수집 실패` : null,
      })
      .eq("id", runId);
    if (finishError) throw finishError;

    return Response.json({
      ok: status === "success",
      syncDate,
      batchIndex,
      activeNewsCount,
      failedStocks: failures.length,
      stocks: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("news_sync_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error: message })
      .eq("id", runId);

    return Response.json({ error: message }, { status: 500 });
  }
});
