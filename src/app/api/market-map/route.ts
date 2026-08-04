import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { getQuote } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const SHARED_RESPONSE_CACHE = "public, s-maxage=25, stale-while-revalidate=5";

const FALLBACK_MARKET_MAP_WEIGHTS: Record<string, number> = {
  "005930.KS": 12,
  "000660.KS": 10,
  "373220.KS": 8,
  "207940.KS": 8,
  "005380.KS": 7,
  "000270.KS": 6,
  "005490.KS": 6,
  "035420.KS": 5,
  "012450.KS": 5,
  "105560.KS": 5,
  "055550.KS": 4,
  "086790.KS": 4,
  "267260.KS": 4,
  "034020.KS": 4,
  "068270.KS": 4,
  "006400.KS": 4,
  "042700.KS": 3,
  "010120.KS": 3,
  "298040.KS": 3,
  "329180.KS": 3,
  "042660.KS": 3,
  "010140.KS": 3,
  "047810.KS": 3,
  "064350.KS": 3,
  "015760.KS": 3,
  "000720.KS": 3,
  "012330.KS": 3,
  "000100.KS": 3,
  "035720.KS": 3,
  "259960.KS": 3,
};

export async function GET() {
  const [quotedItems, kospi] = await Promise.all([
    Promise.all(
      STOCKS.map(async (stock) => {
        try {
          const quote = await getQuote(stock.ticker);
          return {
            ticker: stock.ticker,
            name: stock.name,
            sector: stock.sector,
            weight: FALLBACK_MARKET_MAP_WEIGHTS[stock.ticker] ?? 3,
            marketCap: quote.marketCap ?? null,
            price: quote.regularMarketPrice ?? null,
            changePercent: quote.regularMarketChangePercent ?? null,
          };
        } catch {
          return {
            ticker: stock.ticker,
            name: stock.name,
            sector: stock.sector,
            weight: FALLBACK_MARKET_MAP_WEIGHTS[stock.ticker] ?? 3,
            marketCap: null,
            price: null,
            changePercent: null,
          };
        }
      })
    ),
    getQuote("^KS11")
      .then((quote) => ({
        value: quote.regularMarketPrice ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
      }))
      .catch(() => ({ value: null, changePercent: null })),
  ]);

  const maxMarketCap = Math.max(
    0,
    ...quotedItems.map((item) => item.marketCap ?? 0)
  );
  const items = quotedItems.map((item) => {
    const hasMarketCap = item.marketCap != null && item.marketCap > 0 && maxMarketCap > 0;
    const fallbackRatio = Math.max(
      0.018,
      Math.pow(Math.max(item.weight - 3, 0) / 9, 2)
    );

    return {
      ticker: item.ticker,
      name: item.name,
      sector: item.sector,
      weight: hasMarketCap
        ? 3 + 9 * Math.sqrt(item.marketCap! / maxMarketCap)
        : item.weight,
      marketCap: item.marketCap,
      size: hasMarketCap
        ? item.marketCap!
        : maxMarketCap > 0
          ? maxMarketCap * fallbackRatio
          : item.weight,
      price: item.price,
      changePercent: item.changePercent,
    };
  });

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      kospi,
      basis: {
        size: "산업군 합계 및 종목별 Yahoo Finance 시가총액",
        color: "Yahoo Finance 당일 등락률",
        refresh: "화면이 열려 있는 동안 30초마다 자동 갱신 (서버 공유 캐시 25초)",
      },
      items,
    },
    { headers: { "Cache-Control": SHARED_RESPONSE_CACHE } }
  );
}
