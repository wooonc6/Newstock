import { unstable_cache } from "next/cache";
import { getMarketScheduleStatus, type MarketScheduleStatus } from "@/lib/marketSchedule";

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

export type TradingQuote = YahooQuote & {
  executionPrice: number | null;
  dashboardPrice: number | null;
  executionPriceBasis: string;
  executionPriceLabel: string;
  sessionLabel: string;
  sessionKind: MarketScheduleStatus["newstock"]["kind"];
  mayDifferFromDashboard: boolean;
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
// Map. Public quote helpers below stay separated by use case, while this low
// level Yahoo snapshot can still be reused safely for rate-limit control.
const getCachedQuote = unstable_cache(
  async (ticker: string) => fetchQuoteFromYahoo(ticker),
  ["yahoo-quote-v1"],
  { revalidate: QUOTE_CACHE_SECONDS }
);

export async function getDashboardQuote(ticker: string): Promise<YahooQuote> {
  return getCachedQuote(ticker);
}

function positivePrice(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function resolveTradingExecutionPrice(
  quote: YahooQuote,
  marketStatus: MarketScheduleStatus
): Pick<TradingQuote, "executionPrice" | "executionPriceBasis" | "executionPriceLabel" | "mayDifferFromDashboard"> {
  const dashboardPrice = positivePrice(quote.regularMarketPrice);
  const previousClose = positivePrice(quote.regularMarketPreviousClose);
  const latestPrice = positivePrice(quote.regularMarketPrice, quote.regularMarketPreviousClose);

  switch (marketStatus.newstock.kind) {
    case "pre_close_price":
      return {
        executionPrice: previousClose ?? latestPrice,
        executionPriceBasis: "전일 종가 기준",
        executionPriceLabel: "장전 시간외종가",
        mayDifferFromDashboard: Boolean(previousClose && dashboardPrice && previousClose !== dashboardPrice),
      };
    case "regular":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "정규장 최근 현재가 기준",
        executionPriceLabel: "정규장 현재가",
        mayDifferFromDashboard: false,
      };
    case "after_close_price":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "당일 종가에 가까운 마지막 확인가 기준",
        executionPriceLabel: "장후 시간외종가",
        mayDifferFromDashboard: false,
      };
    case "after_single_price":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "Newstock 단일가 기준가",
        executionPriceLabel: "시간외단일가",
        mayDifferFromDashboard: true,
      };
    case "learning_after_class":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "Newstock 애프터 기준가",
        executionPriceLabel: "Newstock 애프터 세션 기준가",
        mayDifferFromDashboard: true,
      };
    case "opening_call":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "시가 결정 전 최근 확인가 기준",
        executionPriceLabel: "시가 준비 기준가",
        mayDifferFromDashboard: true,
      };
    case "closing_call":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "종가 결정 전 최근 확인가 기준",
        executionPriceLabel: "종가 준비 기준가",
        mayDifferFromDashboard: true,
      };
    case "closing_gap":
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "당일 종가 확인 대기 기준가",
        executionPriceLabel: "장후 접수 대기 기준가",
        mayDifferFromDashboard: true,
      };
    default:
      return {
        executionPrice: latestPrice,
        executionPriceBasis: "마지막 거래일 종가 또는 최근 확인가 기준",
        executionPriceLabel: "Newstock 참고 기준가",
        mayDifferFromDashboard: true,
      };
  }
}

export async function getTradingQuote(
  ticker: string,
  marketStatus: MarketScheduleStatus = getMarketScheduleStatus()
): Promise<TradingQuote> {
  const quote = await getCachedQuote(ticker);
  const resolved = resolveTradingExecutionPrice(quote, marketStatus);

  return {
    ...quote,
    ...resolved,
    dashboardPrice: positivePrice(quote.regularMarketPrice),
    sessionLabel: marketStatus.newstock.label,
    sessionKind: marketStatus.newstock.kind,
  };
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
