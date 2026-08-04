import { unstable_cache } from "next/cache";

type YahooQuote = {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  shortName?: string;
  currency?: string;
};

let yahooClient: any;

async function getYahooClient() {
  if (yahooClient) return yahooClient;

  const mod = await import("yahoo-finance2");
  const YahooFinance = (mod as any).default ?? mod;
  yahooClient = typeof YahooFinance === "function" ? new YahooFinance() : YahooFinance;
  yahooClient.suppressNotices?.(["yahooSurvey"]);
  return yahooClient;
}

/**
 * Shared quote snapshot lifetime.  It is slightly shorter than the 30-second
 * client refresh so a newly started refresh cycle can normally obtain a new
 * Yahoo value, while simultaneous visitors reuse the same snapshot.
 */
export const QUOTE_CACHE_SECONDS = 25;

async function fetchQuoteFromYahoo(ticker: string): Promise<YahooQuote> {
  const yahoo = await getYahooClient();

  if (typeof yahoo.quote !== "function") {
    throw new Error("Yahoo Finance quote API를 찾을 수 없습니다.");
  }

  try {
    return await yahoo.quote(ticker, {
      fields: [
        "regularMarketPrice",
        "regularMarketChange",
        "regularMarketChangePercent",
        "regularMarketPreviousClose",
        "regularMarketVolume",
        "marketCap",
        "shortName",
        "currency",
      ],
    });
  } catch {
    return getChartQuote(ticker);
  }
}

// Next's Data Cache is shared by Vercel server instances, unlike a module-level
// Map. The ticker argument is part of the cache key, so each supported symbol
// has one shared 25-second Yahoo snapshot across dashboard, portfolio, detail,
// trade, and conditional-order requests.
const getCachedQuote = unstable_cache(
  async (ticker: string) => fetchQuoteFromYahoo(ticker),
  ["yahoo-quote-v1"],
  { revalidate: QUOTE_CACHE_SECONDS }
);

export async function getQuote(ticker: string): Promise<YahooQuote> {
  return getCachedQuote(ticker);
}

async function getChartQuote(ticker: string): Promise<YahooQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1m`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo chart API 실패: ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const quote = result?.indicators?.quote?.[0] ?? {};
  const closes = (quote.close ?? []).filter((value: number | null) => typeof value === "number");
  const volumes = (quote.volume ?? []).filter((value: number | null) => typeof value === "number");
  const price = meta.regularMarketPrice ?? closes.at(-1);
  const prevClose = meta.previousClose ?? meta.chartPreviousClose;

  if (!price) {
    throw new Error("Yahoo chart API 가격 없음");
  }

  const change = typeof prevClose === "number" ? price - prevClose : undefined;
  const changePercent = change != null && prevClose ? (change / prevClose) * 100 : undefined;

  return {
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePercent,
    regularMarketPreviousClose: prevClose,
    regularMarketVolume: meta.regularMarketVolume ?? volumes.at(-1),
    currency: meta.currency ?? "KRW",
    shortName: meta.shortName ?? meta.symbol,
  };
}
